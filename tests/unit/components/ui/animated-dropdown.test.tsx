import { fireEvent } from '@testing-library/react';
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

  it('scrolls the trigger into view when less than 280px remains below', async () => {
    const { user } = render(
      <AnimatedDropdown id="scroll-open-dd" text="Pick" items={[{ name: 'One', value: '1' }]} />,
    );

    const trigger = screen.getByRole('button', { name: /pick/i });
    jest.spyOn(trigger, 'getBoundingClientRect').mockReturnValue(triggerRect);
    const scrollIntoView = jest.fn();
    trigger.scrollIntoView = scrollIntoView;

    await user.click(trigger);

    expect(scrollIntoView).toHaveBeenCalled();
    expect(scrollIntoView.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ block: 'center' }),
    );
    expect(parseFloat(screen.getByRole('listbox').style.top)).toBeGreaterThanOrEqual(
      triggerRect.bottom + 4 - 0.5,
    );
  });

  it('does not scroll when at least 280px remains below the trigger', async () => {
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 900,
    });
    const roomyRect = {
      ...triggerRect,
      top: 40,
      bottom: 80,
      y: 40,
    } as DOMRect;

    const { user } = render(
      <AnimatedDropdown id="roomy-dd" text="Pick" items={[{ name: 'One', value: '1' }]} />,
    );

    const trigger = screen.getByRole('button', { name: /pick/i });
    jest.spyOn(trigger, 'getBoundingClientRect').mockReturnValue(roomyRect);
    const scrollIntoView = jest.fn();
    trigger.scrollIntoView = scrollIntoView;

    await user.click(trigger);

    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });
});

describe('AnimatedDropdown trigger label and exit', () => {
  it('keeps the leading icon visible when hideTriggerLabel is set', () => {
    render(
      <AnimatedDropdown
        id="icon-dd"
        text="Language"
        hideTriggerLabel
        hideChevron
        leadingIcon={<span data-testid="lead-icon">icon</span>}
        items={[{ name: 'English', value: 'en' }]}
      />,
    );

    const icon = screen.getByTestId('lead-icon');
    const label = screen.getByText('Language');

    expect(icon).toBeVisible();
    expect(icon.closest('.sr-only')).toBeNull();
    expect(label).toHaveClass('sr-only');
    expect(label.contains(icon)).toBe(false);
  });

  it('keeps the listbox mounted through the close animation', async () => {
    const { user } = render(
      <AnimatedDropdown id="exit-dd" text="Pick" items={[{ name: 'One', value: '1' }]} />,
    );

    const trigger = screen.getByRole('button', { name: /pick/i });
    await user.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });
});

describe('AnimatedDropdown keyboard', () => {
  const keyboardItems = [
    { name: 'Common', header: true },
    { name: 'Alpha', value: 'a' },
    { name: 'All', header: true },
    { name: 'Beta', value: 'b' },
    { name: 'Gamma', value: 'c' },
  ];

  it('opens on ArrowDown, Enter, and Space and highlights the current value', async () => {
    const { user } = render(
      <AnimatedDropdown
        id="kb-open"
        text="Pick"
        selectedValue="b"
        items={keyboardItems}
      />,
    );

    const trigger = screen.getByRole('button', { name: /^beta$/i });
    trigger.focus();
    await user.keyboard('{ArrowDown}');

    const beta = screen.getByRole('option', { name: 'Beta' });
    expect(beta).toHaveAttribute('id');
    expect(trigger).toHaveAttribute('aria-activedescendant', beta.id);

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    trigger.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(trigger).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Beta' }).id,
    );

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    trigger.focus();
    await user.keyboard(' ');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(trigger).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Beta' }).id,
    );
  });

  it('moves the active option with ArrowDown, ArrowUp, Home, and End and scrolls it into view', async () => {
    const { user } = render(
      <AnimatedDropdown id="kb-move" text="Pick" items={keyboardItems} />,
    );

    const trigger = screen.getByRole('button', { name: /pick/i });
    trigger.focus();
    await user.keyboard('{ArrowDown}');

    const alpha = screen.getByRole('option', { name: 'Alpha' });
    const beta = screen.getByRole('option', { name: 'Beta' });
    const gamma = screen.getByRole('option', { name: 'Gamma' });
    const betaScroll = jest.fn();
    const gammaScroll = jest.fn();
    const alphaScroll = jest.fn();
    beta.scrollIntoView = betaScroll;
    gamma.scrollIntoView = gammaScroll;
    alpha.scrollIntoView = alphaScroll;

    expect(trigger).toHaveAttribute('aria-activedescendant', alpha.id);

    await user.keyboard('{ArrowDown}');
    expect(trigger).toHaveAttribute('aria-activedescendant', beta.id);
    expect(betaScroll).toHaveBeenCalled();

    await user.keyboard('{End}');
    expect(trigger).toHaveAttribute('aria-activedescendant', gamma.id);
    expect(gammaScroll).toHaveBeenCalled();

    await user.keyboard('{Home}');
    expect(trigger).toHaveAttribute('aria-activedescendant', alpha.id);
    expect(alphaScroll).toHaveBeenCalled();

    await user.keyboard('{ArrowUp}');
    expect(trigger).toHaveAttribute('aria-activedescendant', alpha.id);
  });

  it('selects the active option on Enter', async () => {
    const onSelect = jest.fn();
    const { user } = render(
      <AnimatedDropdown
        id="kb-enter"
        text="Pick"
        items={keyboardItems}
        onSelect={onSelect}
      />,
    );

    const trigger = screen.getByRole('button', { name: /pick/i });
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ value: 'b' }));
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
    expect(trigger).toHaveFocus();
  });

  it('puts aria-activedescendant on the search input and navigates Country-style options', async () => {
    const onSelect = jest.fn();
    const { user } = render(
      <AnimatedDropdown
        id="default-country"
        text="Select your country"
        searchable
        searchPlaceholder="Select your country"
        selectedValue="DE"
        onSelect={onSelect}
        items={[
          { name: 'Common', header: true },
          { name: 'United Arab Emirates', value: 'AE' },
          { name: 'All countries', header: true },
          { name: 'Germany', value: 'DE' },
          { name: 'Ghana', value: 'GH' },
        ]}
      />,
    );

    const trigger = screen.getByRole('button', { name: /germany/i });
    trigger.focus();
    await user.keyboard('{ArrowDown}');

    const search = screen.getByRole('searchbox', { name: /select your country/i });
    expect(search).toHaveFocus();
    const germany = screen.getByRole('option', { name: 'Germany' });
    expect(germany).toHaveAttribute('id');
    expect(search).toHaveAttribute('aria-activedescendant', germany.id);

    await user.keyboard('{ArrowDown}');
    expect(search).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Ghana' }).id,
    );

    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ value: 'GH' }));
  });

  it('closes from the Country search input on Escape and returns focus to the trigger', async () => {
    const { user } = render(
      <AnimatedDropdown
        id="country-select"
        text="Select your country"
        searchable
        searchPlaceholder="Select your country"
        items={[
          { name: 'Common', header: true },
          { name: 'Germany', value: 'DE' },
        ]}
      />,
    );

    const trigger = screen.getByRole('button', { name: /select your country/i });
    await user.click(trigger);
    const search = screen.getByRole('searchbox', { name: /select your country/i });
    expect(search).toHaveFocus();

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
    expect(trigger).toHaveFocus();
  });
});

describe('AnimatedDropdown Tab, blur, and portal clicks', () => {
  const gradeItems = [
    { name: 'Grade 5', value: '5' },
    { name: 'Grade 6', value: '6' },
  ];
  const countryItems = [
    { name: 'Common', header: true },
    { name: 'Germany', value: 'DE' },
    { name: 'All countries', header: true },
    { name: 'Ghana', value: 'GH' },
  ];

  it('closes Grade on Tab and Shift+Tab and lets focus move to the next or previous control', async () => {
    const { user } = render(
      <div>
        <button type="button">Before grade</button>
        <AnimatedDropdown id="default-grade" text="Select grade" items={gradeItems} />
        <button type="button">After grade</button>
      </div>,
    );

    const trigger = screen.getByRole('button', { name: /select grade/i });
    await user.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.tab();
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /after grade/i })).toHaveFocus();

    await user.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    trigger.focus();
    await user.tab({ shift: true });
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /before grade/i })).toHaveFocus();
  });

  it('focuses the Country trigger on Tab keydown from the portaled search so default Tab hits the next field', async () => {
    const { user } = render(
      <div>
        <button type="button">Before country</button>
        <AnimatedDropdown
          id="default-country"
          text="Select your country"
          searchable
          searchPlaceholder="Select your country"
          items={countryItems}
        />
        <button type="button">After country</button>
      </div>,
    );

    const trigger = screen.getByRole('button', { name: /select your country/i });
    await user.click(trigger);
    const search = screen.getByRole('searchbox', { name: /select your country/i });
    expect(search).toHaveFocus();

    const focusAtKeydown: Element[] = [];
    const recordFocus = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key === 'Tab' && !event.shiftKey) {
        focusAtKeydown.push(document.activeElement ?? document.body);
      }
    };
    document.addEventListener('keydown', recordFocus);
    fireEvent.keyDown(search, { key: 'Tab' });
    document.removeEventListener('keydown', recordFocus);

    expect(focusAtKeydown[0]).toBe(trigger);
    expect(trigger).toHaveFocus();
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('focuses the Country trigger on Shift+Tab keydown from the portal list so default Shift+Tab hits the previous field', async () => {
    const { user } = render(
      <div>
        <button type="button">Before country</button>
        <AnimatedDropdown
          id="default-country"
          text="Select your country"
          searchable
          searchPlaceholder="Select your country"
          items={countryItems}
        />
        <button type="button">After country</button>
      </div>,
    );

    const trigger = screen.getByRole('button', { name: /select your country/i });
    await user.click(trigger);
    const listbox = screen.getByRole('listbox');
    expect(screen.getByRole('searchbox', { name: /select your country/i })).toHaveFocus();

    const focusAtKeydown: Element[] = [];
    const recordFocus = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key === 'Tab' && event.shiftKey) {
        focusAtKeydown.push(document.activeElement ?? document.body);
      }
    };
    document.addEventListener('keydown', recordFocus);
    fireEvent.keyDown(listbox, { key: 'Tab', shiftKey: true });
    document.removeEventListener('keydown', recordFocus);

    expect(focusAtKeydown[0]).toBe(trigger);
    expect(trigger).toHaveFocus();
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('closes Country on Tab and Shift+Tab from the search box and moves focus to the neighboring fields', async () => {
    const { user } = render(
      <div>
        <button type="button">Before country</button>
        <AnimatedDropdown
          id="default-country"
          text="Select your country"
          searchable
          searchPlaceholder="Select your country"
          items={countryItems}
        />
        <button type="button">After country</button>
      </div>,
    );

    const trigger = screen.getByRole('button', { name: /select your country/i });
    await user.click(trigger);
    const search = screen.getByRole('searchbox', { name: /select your country/i });
    expect(search).toHaveFocus();
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    const focusAtTab: Element[] = [];
    const recordTab = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key === 'Tab' && !event.shiftKey) {
        focusAtTab.push(document.activeElement ?? document.body);
      }
    };
    document.addEventListener('keydown', recordTab);
    await user.tab();
    document.removeEventListener('keydown', recordTab);
    expect(focusAtTab[0]).toBe(trigger);
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    await user.click(trigger);
    const searchAgain = screen.getByRole('searchbox', { name: /select your country/i });
    expect(searchAgain).toHaveFocus();
    fireEvent.keyDown(searchAgain, { key: 'Tab' });
    expect(trigger).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: /after country/i })).toHaveFocus();

    await user.click(trigger);
    const searchShift = screen.getByRole('searchbox', { name: /select your country/i });
    fireEvent.keyDown(searchShift, { key: 'Tab', shiftKey: true });
    expect(trigger).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: /before country/i })).toHaveFocus();
  });

  it('closes Grade when focus leaves the trigger for an outside control', async () => {
    const { user } = render(
      <div>
        <AnimatedDropdown id="default-grade" text="Select grade" items={gradeItems} />
        <button type="button">After grade</button>
      </div>,
    );

    const trigger = screen.getByRole('button', { name: /select grade/i });
    const after = screen.getByRole('button', { name: /after grade/i });
    await user.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.blur(trigger, { relatedTarget: after });
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('closes Country when focus leaves the search box for an outside control', async () => {
    const { user } = render(
      <div>
        <AnimatedDropdown
          id="default-country"
          text="Select your country"
          searchable
          searchPlaceholder="Select your country"
          items={countryItems}
        />
        <button type="button">After country</button>
      </div>,
    );

    await user.click(screen.getByRole('button', { name: /select your country/i }));
    const search = screen.getByRole('searchbox', { name: /select your country/i });
    const after = screen.getByRole('button', { name: /after country/i });
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.blur(search, { relatedTarget: after });
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('does not treat focus moving into the portaled Country search or options as leaving', async () => {
    const { user } = render(
      <AnimatedDropdown
        id="default-country"
        text="Select your country"
        searchable
        searchPlaceholder="Select your country"
        items={countryItems}
      />,
    );

    const trigger = screen.getByRole('button', { name: /select your country/i });
    await user.click(trigger);
    const search = screen.getByRole('searchbox', { name: /select your country/i });
    const option = screen.getByRole('option', { name: 'Germany' });
    const listbox = screen.getByRole('listbox');

    fireEvent.blur(trigger, { relatedTarget: search });
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.blur(search, { relatedTarget: option });
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.blur(listbox, { relatedTarget: search });
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('selects a Grade option on click and unmounts the portal list', async () => {
    const onSelect = jest.fn();
    const { user } = render(
      <AnimatedDropdown
        id="default-grade"
        text="Select grade"
        items={gradeItems}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole('button', { name: /select grade/i }));
    await user.click(screen.getByRole('option', { name: 'Grade 5' }));

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ value: '5' }));
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('selects a Country option on click and unmounts the portal list', async () => {
    const onSelect = jest.fn();
    const { user } = render(
      <AnimatedDropdown
        id="default-country"
        text="Select your country"
        searchable
        searchPlaceholder="Select your country"
        items={countryItems}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole('button', { name: /select your country/i }));
    expect(screen.getByRole('searchbox', { name: /select your country/i })).toHaveFocus();
    await user.click(screen.getByRole('option', { name: 'Germany' }));

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ value: 'DE' }));
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('keeps Country open when clicking into the search box', async () => {
    const { user } = render(
      <AnimatedDropdown
        id="default-country"
        text="Select your country"
        searchable
        searchPlaceholder="Select your country"
        items={countryItems}
      />,
    );

    const trigger = screen.getByRole('button', { name: /select your country/i });
    await user.click(trigger);
    const search = screen.getByRole('searchbox', { name: /select your country/i });
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.click(search);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(search).toHaveFocus();
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

  it('uses theme background tokens and does not transition color or background', () => {
    render(<AnimatedDropdown id="theme-dd" text="Pick" items={[{ name: 'One', value: '1' }]} />);
    const trigger = screen.getByRole('button', { name: /pick/i });
    expect(trigger.className).toMatch(/background-elevated|--color-background/);
    expect(trigger.className).not.toMatch(/transition-colors/);
    expect(trigger.className).not.toMatch(/background-color/);
  });
});
