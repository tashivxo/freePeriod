import { render, screen } from '@/tests/helpers';
import { ChipRadio } from '@/components/ui/ChipRadio';

describe('ChipRadio', () => {
  it('exposes radio semantics and selected styles', async () => {
    const onSelect = jest.fn();
    const { user, rerender } = render(
      <ChipRadio checked={false} onSelect={onSelect}>
        Mathematics
      </ChipRadio>,
    );

    const radio = screen.getByRole('radio', { name: /mathematics/i });
    expect(radio).toHaveAttribute('aria-checked', 'false');
    expect(radio.className).not.toContain('bg-primary');

    await user.click(radio);
    expect(onSelect).toHaveBeenCalledTimes(1);

    rerender(
      <ChipRadio checked onSelect={onSelect}>
        Mathematics
      </ChipRadio>,
    );
    expect(screen.getByRole('radio', { name: /mathematics/i })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('radio').className).toContain('bg-primary');
  });
});
