import { useState } from 'react';
import { contrastRatio } from '@/tests/helpers/contrast';
import { render, screen } from '@/tests/helpers';
import { ChipRadio } from '@/components/forms/ChipRadio';

const CORAL = '#FF8BB0';
const PRIMARY_FOREGROUND_LIGHT = '#1A1A2E';
const PRIMARY_FOREGROUND_DARK = '#060918';

const OPTIONS = ['Bug', 'Idea', 'Billing'] as const;

function ChipRadioGroupHarness({
  dir = 'ltr',
  initial = 'Bug',
}: {
  dir?: 'ltr' | 'rtl';
  initial?: (typeof OPTIONS)[number] | '';
}) {
  const [value, setValue] = useState<(typeof OPTIONS)[number] | ''>(initial);
  return (
    <>
      <button type="button">Before</button>
      <div role="radiogroup" aria-label="Category" dir={dir}>
        {OPTIONS.map((option) => (
          <ChipRadio key={option} checked={value === option} onSelect={() => setValue(option)}>
            {option}
          </ChipRadio>
        ))}
      </div>
      <button type="button">After</button>
    </>
  );
}

describe('ChipRadio', () => {
  it('exposes radio semantics and a high-contrast selected state', async () => {
    const onSelect = jest.fn();
    const { user, rerender } = render(
      <ChipRadio checked={false} onSelect={onSelect}>
        Mathematics
      </ChipRadio>,
    );

    const radio = screen.getByRole('radio', { name: /mathematics/i });
    expect(radio).toHaveAttribute('aria-checked', 'false');
    expect(radio.className).not.toContain('bg-coral');
    expect(radio.className).not.toContain('text-white');
    expect(radio.querySelector('svg')).toBeNull();

    await user.click(radio);
    expect(onSelect).toHaveBeenCalledTimes(1);

    rerender(
      <ChipRadio checked onSelect={onSelect}>
        Mathematics
      </ChipRadio>,
    );
    const selected = screen.getByRole('radio', { name: /mathematics/i });
    expect(selected).toHaveAttribute('aria-checked', 'true');
    expect(selected.className).toContain('bg-coral');
    expect(selected.className).toContain('text-primary-foreground');
    expect(selected.className).not.toContain('text-white');
    expect(selected.querySelector('svg')).not.toBeNull();
  });

  it('keeps selected coral fill and primary-foreground text at WCAG AA in light and dark', () => {
    expect(contrastRatio(PRIMARY_FOREGROUND_LIGHT, CORAL)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(PRIMARY_FOREGROUND_DARK, CORAL)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#FFFFFF', CORAL)).toBeLessThan(4.5);
  });

  it('uses one tab stop for the checked chip and moves with arrow keys', async () => {
    const { user } = render(<ChipRadioGroupHarness />);

    const bug = screen.getByRole('radio', { name: 'Bug' });
    const idea = screen.getByRole('radio', { name: 'Idea' });
    const billing = screen.getByRole('radio', { name: 'Billing' });

    expect(bug).toHaveAttribute('tabindex', '0');
    expect(idea).toHaveAttribute('tabindex', '-1');
    expect(billing).toHaveAttribute('tabindex', '-1');

    await user.tab();
    expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus();
    await user.tab();
    expect(bug).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();

    bug.focus();
    await user.keyboard('{ArrowRight}');
    expect(idea).toHaveFocus();
    expect(idea).toHaveAttribute('aria-checked', 'true');
    expect(bug).toHaveAttribute('aria-checked', 'false');
    expect(idea).toHaveAttribute('tabindex', '0');
    expect(bug).toHaveAttribute('tabindex', '-1');

    await user.keyboard('{ArrowDown}');
    expect(billing).toHaveFocus();
    expect(billing).toHaveAttribute('aria-checked', 'true');

    await user.keyboard('{ArrowRight}');
    expect(bug).toHaveFocus();
    expect(bug).toHaveAttribute('aria-checked', 'true');

    await user.keyboard('{ArrowLeft}');
    expect(billing).toHaveFocus();
    expect(billing).toHaveAttribute('aria-checked', 'true');

    await user.keyboard('{ArrowUp}');
    expect(idea).toHaveFocus();
    expect(idea).toHaveAttribute('aria-checked', 'true');
  });

  it('mirrors Left and Right arrows in RTL', async () => {
    const { user } = render(<ChipRadioGroupHarness dir="rtl" />);

    const bug = screen.getByRole('radio', { name: 'Bug' });
    const idea = screen.getByRole('radio', { name: 'Idea' });
    const billing = screen.getByRole('radio', { name: 'Billing' });

    bug.focus();
    await user.keyboard('{ArrowLeft}');
    expect(idea).toHaveFocus();
    expect(idea).toHaveAttribute('aria-checked', 'true');

    await user.keyboard('{ArrowRight}');
    expect(bug).toHaveFocus();
    expect(bug).toHaveAttribute('aria-checked', 'true');

    await user.keyboard('{ArrowRight}');
    expect(billing).toHaveFocus();
    expect(billing).toHaveAttribute('aria-checked', 'true');
  });

  it('tabs to the first chip when none are selected', async () => {
    const { user } = render(<ChipRadioGroupHarness initial="" />);

    const bug = screen.getByRole('radio', { name: 'Bug' });
    const idea = screen.getByRole('radio', { name: 'Idea' });

    expect(bug).toHaveAttribute('tabindex', '0');
    expect(idea).toHaveAttribute('tabindex', '-1');

    await user.tab();
    expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus();
    await user.tab();
    expect(bug).toHaveFocus();
  });
});
