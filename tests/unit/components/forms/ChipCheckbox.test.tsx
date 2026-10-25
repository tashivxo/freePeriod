import { useState } from 'react';
import { contrastRatio } from '@/tests/helpers/contrast';
import { render, screen } from '@/tests/helpers';
import { ChipCheckbox } from '@/components/forms/ChipCheckbox';

const CORAL = '#FF8BB0';
const PRIMARY_FOREGROUND_LIGHT = '#1A1A2E';
const PRIMARY_FOREGROUND_DARK = '#060918';

function ChipCheckboxHarness({
  dir = 'ltr',
  initial = false,
}: {
  dir?: 'ltr' | 'rtl';
  initial?: boolean;
}) {
  const [checked, setChecked] = useState(initial);
  return (
    <div dir={dir}>
      <button type="button">Before</button>
      <ChipCheckbox
        id="terms-agree"
        checked={checked}
        onCheckedChange={setChecked}
        aria-label="I agree to the Terms of Service and Privacy Policy"
      >
        I agree
      </ChipCheckbox>
      <label htmlFor="terms-agree">to the</label>
      <button type="button">After</button>
    </div>
  );
}

function chipSurface(checkbox: HTMLElement) {
  return checkbox.closest('label') ?? checkbox.parentElement;
}

describe('ChipCheckbox', () => {
  it('exposes checkbox semantics and toggles on click', async () => {
    const onCheckedChange = jest.fn();
    const { user, rerender } = render(
      <ChipCheckbox checked={false} onCheckedChange={onCheckedChange}>
        I agree
      </ChipCheckbox>,
    );

    const checkbox = screen.getByRole('checkbox', { name: /i agree/i });
    expect(checkbox).toHaveAttribute('type', 'checkbox');
    expect(checkbox).not.toBeChecked();
    expect(checkbox).not.toHaveAttribute('role', 'radio');

    await user.click(checkbox);
    expect(onCheckedChange).toHaveBeenCalledWith(true);

    rerender(
      <ChipCheckbox checked onCheckedChange={onCheckedChange}>
        I agree
      </ChipCheckbox>,
    );
    const selected = screen.getByRole('checkbox', { name: /i agree/i });
    expect(selected).toBeChecked();
    const surface = chipSurface(selected);
    expect(surface?.className).toContain('bg-coral');
    expect(surface?.className).toContain('text-primary-foreground');
    expect(surface?.className).not.toContain('text-white');
    expect(surface?.querySelector('svg')).not.toBeNull();
  });

  it('toggles off when clicked while checked', async () => {
    const onCheckedChange = jest.fn();
    const { user } = render(
      <ChipCheckbox checked onCheckedChange={onCheckedChange}>
        I agree
      </ChipCheckbox>,
    );

    await user.click(screen.getByRole('checkbox', { name: /i agree/i }));
    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });

  it('toggles with Space', async () => {
    const { user } = render(<ChipCheckboxHarness />);
    const checkbox = screen.getByRole('checkbox', {
      name: /i agree to the terms of service and privacy policy/i,
    });

    checkbox.focus();
    await user.keyboard(' ');
    expect(checkbox).toBeChecked();

    await user.keyboard(' ');
    expect(checkbox).not.toBeChecked();
  });

  it('toggles when its associated label is clicked', async () => {
    const { user } = render(<ChipCheckboxHarness />);
    const checkbox = screen.getByRole('checkbox', {
      name: /i agree to the terms of service and privacy policy/i,
    });

    await user.click(screen.getByText('to the'));
    expect(checkbox).toBeChecked();

    await user.click(screen.getByText('to the'));
    expect(checkbox).not.toBeChecked();
  });

  it('keeps selected coral fill and primary-foreground text at WCAG AA in light and dark', () => {
    expect(contrastRatio(PRIMARY_FOREGROUND_LIGHT, CORAL)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(PRIMARY_FOREGROUND_DARK, CORAL)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#FFFFFF', CORAL)).toBeLessThan(4.5);
  });

  it('is its own tab stop and still toggles in RTL', async () => {
    const { user } = render(<ChipCheckboxHarness dir="rtl" />);
    const checkbox = screen.getByRole('checkbox', {
      name: /i agree to the terms of service and privacy policy/i,
    });

    await user.tab();
    expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus();
    await user.tab();
    expect(checkbox).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();

    checkbox.focus();
    await user.keyboard(' ');
    expect(checkbox).toBeChecked();
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });
});
