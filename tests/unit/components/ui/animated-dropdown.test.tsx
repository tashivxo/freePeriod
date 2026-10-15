import { useReducedMotion } from 'motion/react';
import { render, screen, waitFor } from '@/tests/helpers';
import { AnimatedDropdown, type DropdownItem } from '@/components/ui/animated-dropdown';

jest.mock('motion/react', () => {
  const actual = jest.requireActual<typeof import('motion/react')>('motion/react');
  return {
    ...actual,
    useReducedMotion: jest.fn(() => false),
  };
});

const mockedUseReducedMotion = useReducedMotion as jest.MockedFunction<typeof useReducedMotion>;

beforeEach(() => {
  mockedUseReducedMotion.mockReturnValue(false);
});

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

describe('AnimatedDropdown fixed shell positioning', () => {
  let rafSpy: jest.SpyInstance<number, [FrameRequestCallback]>;

  beforeEach(() => {
    rafSpy = jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 1;
    });
  });

  afterEach(() => {
    rafSpy.mockRestore();
  });

  it('portals a fixed shell that owns style.top while the listbox node stays stable on window scroll', async () => {
    const { user } = render(
      <AnimatedDropdown id="shell-dd" text="Pick" items={[{ name: 'One', value: '1' }]} />,
    );

    const triggerButton = screen.getByRole('button', { name: /pick/i });

    const initialRect = {
      bottom: 200,
      top: 160,
      left: 10,
      right: 110,
      width: 100,
      height: 40,
      x: 10,
      y: 160,
      toJSON: () => ({}),
    } as DOMRect;

    jest.spyOn(triggerButton, 'getBoundingClientRect').mockReturnValue(initialRect);

    await user.click(triggerButton);

    const shell = screen.getByTestId('dropdown-listbox-shell');
    expect(shell).toHaveStyle({ position: 'fixed' });
    const topAfterOpen = shell.style.top;
    expect(topAfterOpen).not.toBe('');

    const listboxBeforeScroll = screen.getByRole('listbox');

    jest.spyOn(triggerButton, 'getBoundingClientRect').mockReturnValue({
      ...initialRect,
      bottom: 80,
      top: 40,
      y: 40,
    });

    window.dispatchEvent(new Event('scroll', { bubbles: true }));

    expect(shell.style.top).not.toBe(topAfterOpen);

    const listboxAfterScroll = screen.getByRole('listbox');
    expect(listboxAfterScroll).toBe(listboxBeforeScroll);
  });

  it('does not reposition the shell when the listbox itself scrolls', async () => {
    const items: DropdownItem[] = Array.from({ length: 20 }, (_, i) => ({
      name: `Option ${i + 1}`,
      value: String(i + 1),
    }));

    const { user } = render(
      <AnimatedDropdown id="listbox-scroll-dd" text="Pick" items={items} />,
    );

    const triggerButton = screen.getByRole('button', { name: /pick/i });

    jest.spyOn(triggerButton, 'getBoundingClientRect').mockReturnValue({
      bottom: 200,
      top: 160,
      left: 10,
      right: 110,
      width: 100,
      height: 40,
      x: 10,
      y: 160,
      toJSON: () => ({}),
    } as DOMRect);

    await user.click(triggerButton);

    const shell = screen.getByTestId('dropdown-listbox-shell');
    const topAfterOpen = shell.style.top;
    expect(topAfterOpen).not.toBe('');

    const listbox = screen.getByRole('listbox');
    listbox.dispatchEvent(new Event('scroll', { bubbles: true }));

    expect(shell.style.top).toBe(topAfterOpen);
  });
});

describe('AnimatedDropdown option hit area and reduced motion', () => {
  it('gives clickable options min-h-11 and does not apply it to header rows', async () => {
    const { user } = render(
      <AnimatedDropdown
        id="hit-dd"
        text="Pick"
        items={[
          { name: 'Group', header: true },
          { name: 'Option A', value: 'a' },
        ]}
      />,
    );

    await user.click(screen.getByRole('button', { name: /pick/i }));

    expect(screen.getByRole('option', { name: 'Option A' })).toHaveClass('min-h-11');
    expect(screen.getByText('Group')).not.toHaveClass('min-h-11');
  });

  it('skips press scale and timed chevron rotation when reduced motion is preferred', async () => {
    mockedUseReducedMotion.mockReturnValue(true);

    const { user } = render(
      <AnimatedDropdown id="rm-dd" text="Pick" items={[{ name: 'One', value: '1' }]} />,
    );

    const trigger = screen.getByRole('button', { name: /pick/i });
    expect(trigger).not.toHaveClass('active:scale-[0.96]');

    await user.click(trigger);

    const chevronWrap = trigger.querySelector('svg')?.parentElement;
    expect(chevronWrap).toHaveClass('rotate-180');
  });

  it('applies press scale when reduced motion is not preferred', () => {
    render(
      <AnimatedDropdown id="scale-dd" text="Pick" items={[{ name: 'One', value: '1' }]} />,
    );

    expect(screen.getByRole('button', { name: /pick/i })).toHaveClass('active:scale-[0.96]');
  });
});
