import { render, screen } from '@/lib/test-utils';
import { AnimatedDropdown, type DropdownItem } from '@/components/ui/animated-dropdown';

describe('AnimatedDropdown locked options', () => {
  it('renders an icon beside an option name', async () => {
    const { user } = render(
      <AnimatedDropdown
        id="mode"
        text="Select"
        selectedValue="fast"
        items={[
          { name: 'Fast', value: 'fast' },
          {
            name: 'Quality',
            value: 'quality',
            disabled: true,
            icon: <span data-testid="lock-slot">lock</span>,
          },
        ]}
      />,
    );

    await user.click(screen.getByRole('button', { name: /^fast$/i }));
    expect(screen.getByTestId('lock-slot')).toBeInTheDocument();
  });

  it('calls onDisabledSelect when a disabled option is clicked', async () => {
    const onSelect = jest.fn();
    const onDisabledSelect = jest.fn();
    const quality: DropdownItem = {
      name: 'Quality',
      value: 'quality',
      disabled: true,
    };

    const { user } = render(
      <AnimatedDropdown
        id="mode"
        text="Select"
        selectedValue="fast"
        items={[{ name: 'Fast', value: 'fast' }, quality]}
        onSelect={onSelect}
        onDisabledSelect={onDisabledSelect}
      />,
    );

    await user.click(screen.getByRole('button', { name: /^fast$/i }));
    await user.click(screen.getByRole('option', { name: /quality/i }));

    expect(onSelect).not.toHaveBeenCalled();
    expect(onDisabledSelect).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'quality' }),
    );
  });
});
