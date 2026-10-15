import { render, screen, waitFor } from '@/tests/helpers';
import { AnimatedDropdown, type DropdownItem } from '@/components/ui/animated-dropdown';

describe('AnimatedDropdown portal and listbox', () => {
  it('renders the open listbox outside an overflow-hidden ancestor', async () => {
    const { user } = render(
      <div data-testid="clip-wrapper" style={{ overflow: 'hidden' }}>
        <AnimatedDropdown id="test-dd" text="Pick one" items={[{ name: 'Alpha', value: 'a' }]} />
      </div>,
    );

    const wrapper = screen.getByTestId('clip-wrapper');
    await user.click(screen.getByRole('button', { name: /pick one/i }));

    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeInTheDocument();
    expect(wrapper.contains(listbox)).toBe(false);
    expect(document.body.contains(listbox)).toBe(true);
  });

  it('listbox has scrollable max height classes', async () => {
    const { user } = render(
      <AnimatedDropdown id="scroll-dd" text="Pick" items={[{ name: 'One', value: '1' }]} />,
    );

    await user.click(screen.getByRole('button', { name: /pick/i }));
    const listbox = screen.getByRole('listbox');
    expect(listbox.className).toMatch(/overflow-y-auto/);
    expect(listbox.className).toMatch(/max-h-60/);
    expect(listbox.className).toMatch(/z-\[10000\]/);
  });

  it('closes the listbox on Escape', async () => {
    const { user } = render(
      <AnimatedDropdown id="esc-dd" text="Pick" items={[{ name: 'One', value: '1' }]} />,
    );

    await user.click(screen.getByRole('button', { name: /pick/i }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('renders header rows that are not options and do not trigger onSelect', async () => {
    const onSelect = jest.fn();
    const { user } = render(
      <AnimatedDropdown
        id="hdr-dd"
        text="Pick"
        onSelect={onSelect}
        items={[
          { name: 'Common', header: true },
          { name: 'Option A', value: 'a' },
        ]}
      />,
    );

    await user.click(screen.getByRole('button', { name: /pick/i }));
    expect(screen.getByText('Common')).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Common' })).not.toBeInTheDocument();

    await user.click(screen.getByText('Common'));
    expect(onSelect).not.toHaveBeenCalled();

    await user.click(screen.getByRole('option', { name: 'Option A' }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ value: 'a' }));
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('lists duplicate values in separate groups and selects by value', async () => {
    const onSelect = jest.fn();
    const { user } = render(
      <AnimatedDropdown
        id="dup-dd"
        text="Country"
        onSelect={onSelect}
        items={[
          { name: 'Common', header: true },
          { name: 'United Arab Emirates', value: 'AE' },
          { name: 'All countries', header: true },
          { name: 'United Arab Emirates', value: 'AE' },
        ]}
      />,
    );

    await user.click(screen.getByRole('button', { name: /country/i }));
    const uaeOptions = screen.getAllByRole('option', { name: 'United Arab Emirates' });
    expect(uaeOptions).toHaveLength(2);

    await user.click(uaeOptions[1]!);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'AE', name: 'United Arab Emirates' }),
    );
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });
});

describe('AnimatedDropdown placement', () => {
  const triggerRect = {
    top: 520,
    bottom: 560,
    left: 24,
    right: 324,
    width: 300,
    height: 40,
    x: 24,
    y: 520,
    toJSON: () => ({}),
  } as DOMRect;

  beforeEach(() => {
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 600,
    });
  });

  it('always opens below the trigger and caps max-height to space below', async () => {
    const { user } = render(
      <AnimatedDropdown id="below-dd" text="Pick" items={[{ name: 'One', value: '1' }]} />,
    );

    const trigger = screen.getByRole('button', { name: /pick/i });
    jest.spyOn(trigger, 'getBoundingClientRect').mockReturnValue(triggerRect);

    await user.click(trigger);

    const listbox = screen.getByRole('listbox');
    const listTop = parseFloat(listbox.style.top);
    expect(listTop).toBeGreaterThanOrEqual(triggerRect.bottom + 4 - 0.5);

    const maxHeight = parseFloat(listbox.style.maxHeight);
    const spaceBelow = window.innerHeight - triggerRect.bottom - 4 - 8;
    expect(maxHeight).toBeLessThanOrEqual(240);
    if (spaceBelow >= 120) {
      expect(maxHeight).toBeLessThanOrEqual(spaceBelow + 0.5);
    } else {
      expect(maxHeight).toBe(120);
    }
    expect(maxHeight).toBeGreaterThan(0);
  });

  it('never flips above the trigger when space below is tight', async () => {
    const tightRect = {
      ...triggerRect,
      top: 540,
      bottom: 580,
      y: 540,
    } as DOMRect;

    const { user } = render(
      <AnimatedDropdown id="tight-dd" text="Pick" items={[{ name: 'One', value: '1' }]} />,
    );

    const trigger = screen.getByRole('button', { name: /pick/i });
    jest.spyOn(trigger, 'getBoundingClientRect').mockReturnValue(tightRect);

    await user.click(trigger);

    const listbox = screen.getByRole('listbox');
    const listTop = parseFloat(listbox.style.top);
    expect(listTop).toBeGreaterThanOrEqual(tightRect.bottom + 4 - 0.5);
    expect(listTop).toBeGreaterThan(tightRect.top);
  });
});

describe('AnimatedDropdown search', () => {
  it('filters options when searchable is enabled', async () => {
    const { user } = render(
      <AnimatedDropdown
        id="search-dd"
        text="Country"
        searchable
        searchPlaceholder="Filter countries"
        items={[
          { name: 'Common', header: true },
          { name: 'United Arab Emirates', value: 'AE' },
          { name: 'All countries', header: true },
          { name: 'Germany', value: 'DE' },
          { name: 'Ghana', value: 'GH' },
        ]}
      />,
    );

    await user.click(screen.getByRole('button', { name: /country/i }));
    const search = screen.getByRole('searchbox', { name: /filter countries/i });
    await user.type(search, 'ger');

    expect(screen.queryByRole('option', { name: 'United Arab Emirates' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Germany' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Ghana' })).not.toBeInTheDocument();
  });
});

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
