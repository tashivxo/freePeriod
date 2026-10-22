'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/** ~15rem — matches Tailwind `max-h-60` */
const LIST_MAX_HEIGHT_PX = 240;
const TRIGGER_GAP_PX = 4;
const VIEWPORT_PADDING_PX = 8;
/** About 4 rows. Menus open below whenever this much fits; less than this, they may flip up. */
const MIN_USABLE_LIST_HEIGHT_PX = 160;
/** Row heights from the option classes below, used to guess the list height before it renders. */
const OPTION_ROW_PX = 40;
const DESCRIPTION_ROW_PX = 64;
const HEADER_ROW_PX = 32;
const SEARCH_ROW_PX = 57;
const LIST_CHROME_PX = 10;

export interface DropdownItem {
  name: string;
  value?: string;
  link?: string;
  description?: string;
  disabled?: boolean;
  badge?: string;
  icon?: ReactNode;
  header?: boolean;
}

interface AnimatedDropdownProps {
  items?: DropdownItem[];
  text?: string;
  className?: string;
  onSelect?: (item: DropdownItem) => void;
  onDisabledSelect?: (item: DropdownItem) => void;
  selectedValue?: string;
  id?: string;
  triggerAriaLabel?: string;
  triggerAriaLabelledBy?: string;
  triggerClassName?: string;
  leadingIcon?: ReactNode;
  hideChevron?: boolean;
  hideTriggerLabel?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  menuAlign?: 'stretch' | 'end';
  menuMinWidth?: number;
}

type ListboxPlacement = 'below' | 'above';

interface ListboxPosition {
  /** Set when opening below the trigger. */
  top?: number;
  /** Set when opening above, so the menu stays pinned to the trigger as search shrinks it. */
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: ListboxPlacement;
}

function filterDropdownItems(items: DropdownItem[], query: string): DropdownItem[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return items;

  const filtered: DropdownItem[] = [];
  let pendingHeader: DropdownItem | null = null;

  for (const item of items) {
    if (item.header) {
      pendingHeader = item;
      continue;
    }
    if (item.name.toLowerCase().includes(trimmed)) {
      if (pendingHeader) {
        filtered.push(pendingHeader);
        pendingHeader = null;
      }
      filtered.push(item);
    }
  }

  return filtered;
}

function MenuPortal({ children }: { children: ReactNode }) {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}

function itemValue(item: DropdownItem): string {
  return item.value ?? item.name;
}

function isNavigable(item: DropdownItem): boolean {
  return !item.header && !item.disabled;
}

function indexOfValue(items: DropdownItem[], value?: string): number {
  if (!value) return -1;
  return items.findIndex((item) => !item.header && itemValue(item) === value);
}

function firstNavigableIndex(items: DropdownItem[]): number {
  return items.findIndex((item) => isNavigable(item));
}

function lastNavigableIndex(items: DropdownItem[]): number {
  for (let i = items.length - 1; i >= 0; i--) {
    if (isNavigable(items[i]!)) return i;
  }
  return -1;
}

function nextNavigableIndex(
  items: DropdownItem[],
  from: number,
  direction: 1 | -1,
): number {
  let index = from + direction;
  while (index >= 0 && index < items.length) {
    if (isNavigable(items[index]!)) return index;
    index += direction;
  }
  return from;
}

function highlightIndexOnOpen(items: DropdownItem[], selectedValue?: string): number {
  const selected = indexOfValue(items, selectedValue);
  if (selected >= 0) return selected;
  return firstNavigableIndex(items);
}

function estimateListHeight(items: DropdownItem[], searchable: boolean): number {
  let height = LIST_CHROME_PX + (searchable ? SEARCH_ROW_PX : 0);
  for (const item of items) {
    if (height >= LIST_MAX_HEIGHT_PX) break;
    height += item.header ? HEADER_ROW_PX : item.description ? DESCRIPTION_ROW_PX : OPTION_ROW_PX;
  }
  return height;
}

/**
 * Fit the menu inside the viewport without ever scrolling the page: open below whenever
 * about 4 rows fit, shortening the list so it scrolls inside itself; flip above only when
 * less than that is left below and there is more room above. `lockedPlacement` keeps the side chosen
 * on open, so page scroll or resize never makes the open menu jump to the other side.
 */
function computeListboxPosition(
  trigger: HTMLElement,
  menuAlign: 'stretch' | 'end',
  menuMinWidth: number,
  estimatedHeight: number,
  lockedPlacement?: ListboxPlacement,
): ListboxPosition {
  const rect = trigger.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
  const spaceBelow = Math.max(viewportHeight - rect.bottom - TRIGGER_GAP_PX - VIEWPORT_PADDING_PX, 0);
  const spaceAbove = Math.max(rect.top - TRIGGER_GAP_PX - VIEWPORT_PADDING_PX, 0);
  const wantedHeight = Math.min(LIST_MAX_HEIGHT_PX, estimatedHeight);

  const usableHeight = Math.min(wantedHeight, MIN_USABLE_LIST_HEIGHT_PX);
  const lockedSpace = lockedPlacement === 'above' ? spaceAbove : spaceBelow;
  const otherSpace = lockedPlacement === 'above' ? spaceBelow : spaceAbove;
  // Keep the side chosen on open unless page scroll or a shrinking viewport (mobile
  // keyboard) has squeezed it below a usable height and the other side has more room.
  const keepLocked =
    lockedPlacement !== undefined &&
    (lockedSpace >= usableHeight || lockedSpace >= otherSpace);
  const placement: ListboxPlacement = keepLocked
    ? lockedPlacement
    : // Below first: a shorter list that scrolls inside itself beats a menu that opens upward.
      spaceBelow < usableHeight && spaceAbove > spaceBelow
      ? 'above'
      : 'below';
  const maxHeight = Math.min(LIST_MAX_HEIGHT_PX, placement === 'above' ? spaceAbove : spaceBelow);

  const width = Math.min(Math.max(rect.width, menuMinWidth), viewportWidth - VIEWPORT_PADDING_PX * 2);
  const preferredLeft = menuAlign === 'end' ? rect.right - width : rect.left;
  const left = Math.max(
    VIEWPORT_PADDING_PX,
    Math.min(preferredLeft, viewportWidth - width - VIEWPORT_PADDING_PX),
  );

  return placement === 'above'
    ? { bottom: viewportHeight - rect.top + TRIGGER_GAP_PX, left, width, maxHeight, placement }
    : { top: rect.bottom + TRIGGER_GAP_PX, left, width, maxHeight, placement };
}

export function AnimatedDropdown({
  items = [],
  text = 'Select option',
  className,
  onSelect,
  onDisabledSelect,
  selectedValue,
  id,
  triggerAriaLabel,
  triggerAriaLabelledBy,
  triggerClassName,
  leadingIcon,
  hideChevron = false,
  hideTriggerLabel = false,
  searchable = false,
  searchPlaceholder = 'Search',
  menuAlign = 'stretch',
  menuMinWidth = 0,
}: AnimatedDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [listboxPosition, setListboxPosition] = useState<ListboxPosition | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const placementRef = useRef<ListboxPlacement | null>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const optionIdPrefix = `${id ?? 'animated-dropdown'}-option`;

  const optionDomId = useCallback(
    (index: number) => `${optionIdPrefix}-${index}`,
    [optionIdPrefix],
  );

  const visibleItems = useMemo(
    () => (searchable ? filterDropdownItems(items, searchQuery) : items),
    [items, searchable, searchQuery],
  );

  const selectedItem = selectedValue
    ? items.find((item) => !item.header && (item.value ?? item.name) === selectedValue)
    : null;

  const displayText = selectedItem ? selectedItem.name : text;

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    // A menu whose trigger has scrolled out of view has nothing to hang from: close it.
    if (open && (rect.bottom < 0 || rect.top > window.innerHeight)) {
      setOpen(false);
      return;
    }
    const next = computeListboxPosition(
      trigger,
      menuAlign,
      menuMinWidth,
      estimateListHeight(items, searchable),
      placementRef.current ?? undefined,
    );
    placementRef.current = next.placement;
    setListboxPosition(next);
  }, [items, menuAlign, menuMinWidth, open, searchable]);

  const closeMenu = useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) {
      triggerRef.current?.focus({ preventScroll: true });
    }
  }, []);

  const isInsideDropdown = useCallback((target: EventTarget | null) => {
    if (!(target instanceof Node)) return false;
    return Boolean(
      containerRef.current?.contains(target) || listboxRef.current?.contains(target),
    );
  }, []);

  const handleWidgetBlur = useCallback(
    (event: FocusEvent<HTMLElement>) => {
      if (!open) return;
      if (isInsideDropdown(event.relatedTarget)) return;
      closeMenu();
    },
    [closeMenu, isInsideDropdown, open],
  );

  const handleListMouseDown = useCallback((event: ReactMouseEvent<HTMLUListElement>) => {
    const target = event.target as Node;
    if (searchRef.current?.contains(target)) return;
    event.preventDefault();
  }, []);

  const scrollOptionIntoView = useCallback(
    (index: number, waitForRender = false) => {
      if (index < 0) return;
      const optionId = optionDomId(index);
      // Move only the listbox's own scrollTop. Element.scrollIntoView also scrolls every
      // scrollable ancestor, including the page, which is the jump this menu must avoid.
      const scroll = () => {
        const list = listboxRef.current;
        const option = document.getElementById(optionId);
        if (!list || !option || !list.contains(option)) return;
        const stickyHeight = searchRef.current?.parentElement?.offsetHeight ?? 0;
        const optionTop = option.offsetTop - stickyHeight;
        const optionBottom = option.offsetTop + option.offsetHeight;
        if (optionTop < list.scrollTop) {
          list.scrollTop = Math.max(optionTop, 0);
        } else if (optionBottom > list.scrollTop + list.clientHeight) {
          list.scrollTop = optionBottom - list.clientHeight;
        }
      };
      // A newer request wins, so a frame queued on open cannot undo a later keypress.
      if (scrollFrameRef.current !== null) {
        cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
      if (!waitForRender && listboxRef.current && document.getElementById(optionId)) {
        scroll();
        return;
      }
      scrollFrameRef.current = requestAnimationFrame(() => {
        scrollFrameRef.current = null;
        scroll();
      });
    },
    [optionDomId],
  );

  const openMenu = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const highlight = highlightIndexOnOpen(items, selectedValue);
    placementRef.current = null;
    setSearchQuery('');
    updatePosition();
    setActiveIndex(highlight);
    setOpen(true);
    scrollOptionIntoView(highlight);
  }, [items, scrollOptionIntoView, selectedValue, updatePosition]);

  const handleTriggerClick = useCallback(() => {
    if (open) {
      closeMenu();
      return;
    }
    openMenu();
  }, [closeMenu, open, openMenu]);

  const selectIndex = useCallback(
    (index: number) => {
      const item = visibleItems[index];
      if (!item || item.header) return;
      if (item.disabled) {
        if (onDisabledSelect) {
          onDisabledSelect(item);
          closeMenu(true);
        }
        return;
      }
      onSelect?.(item);
      closeMenu(true);
    },
    [closeMenu, onDisabledSelect, onSelect, visibleItems],
  );

  const handleListKeyDown = useCallback(
    (event: { key: string; preventDefault: () => void; stopPropagation: () => void }) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeMenu(true);
        return true;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        event.stopPropagation();
        const next = nextNavigableIndex(visibleItems, activeIndex, 1);
        setActiveIndex(next);
        scrollOptionIntoView(next);
        return true;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        event.stopPropagation();
        const next = nextNavigableIndex(visibleItems, activeIndex, -1);
        setActiveIndex(next);
        scrollOptionIntoView(next);
        return true;
      }
      if (event.key === 'Home') {
        event.preventDefault();
        event.stopPropagation();
        const next = firstNavigableIndex(visibleItems);
        setActiveIndex(next);
        scrollOptionIntoView(next);
        return true;
      }
      if (event.key === 'End') {
        event.preventDefault();
        event.stopPropagation();
        const next = lastNavigableIndex(visibleItems);
        setActiveIndex(next);
        scrollOptionIntoView(next);
        return true;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        selectIndex(activeIndex);
        return true;
      }
      if (event.key === 'Tab') {
        const active = document.activeElement;
        if (active && listboxRef.current?.contains(active)) {
          triggerRef.current?.focus({ preventScroll: true });
        }
        closeMenu();
        return true;
      }
      return false;
    },
    [activeIndex, closeMenu, scrollOptionIntoView, selectIndex, visibleItems],
  );

  const handleTriggerKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (!open) {
        if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openMenu();
        }
        return;
      }
      if (event.key === ' ') {
        event.preventDefault();
        selectIndex(activeIndex);
        return;
      }
      handleListKeyDown(event);
    },
    [activeIndex, handleListKeyDown, open, openMenu, selectIndex],
  );

  const handleSearchKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      handleListKeyDown(event);
    },
    [handleListKeyDown],
  );

  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextQuery = event.target.value;
      setSearchQuery(nextQuery);
      const nextVisible = filterDropdownItems(items, nextQuery);
      const nextActive = highlightIndexOnOpen(nextVisible, selectedValue);
      setActiveIndex(nextActive);
      // The filtered rows are not in the DOM yet; the old row at this index is a different option.
      scrollOptionIntoView(nextActive, true);
    },
    [items, scrollOptionIntoView, selectedValue],
  );

  useEffect(() => {
    if (!open) return;

    const handleScroll = (event: Event) => {
      // The list scrolling itself does not move the trigger.
      if (event.target instanceof Node && listboxRef.current?.contains(event.target)) return;
      updatePosition();
    };
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (open && searchable) {
      searchRef.current?.focus({ preventScroll: true });
    }
  }, [open, searchable]);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        containerRef.current?.contains(target) ||
        listboxRef.current?.contains(target)
      ) {
        return;
      }
      closeMenu();
    }

    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [closeMenu, open]);

  useEffect(() => {
    function handleDocumentKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') {
        closeMenu(true);
      }
    }

    if (open) {
      document.addEventListener('keydown', handleDocumentKeyDown);
      return () => document.removeEventListener('keydown', handleDocumentKeyDown);
    }
  }, [closeMenu, open]);

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        onBlur={handleWidgetBlur}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id ?? 'animated-dropdown'}-listbox` : undefined}
        aria-activedescendant={
          open && !searchable && activeIndex >= 0 ? optionDomId(activeIndex) : undefined
        }
        aria-label={triggerAriaLabelledBy ? undefined : triggerAriaLabel}
        aria-labelledby={triggerAriaLabelledBy}
        className={cn(
          'h-13 w-full flex items-center justify-between gap-2 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-background-elevated)] ps-4 pe-3 font-body text-base hover:border-coral/60 focus:border-coral focus:ring-2 focus:ring-coral/20 focus:outline-none',
          triggerClassName,
        )}
      >
        {leadingIcon ? (
          <span className="inline-flex shrink-0 items-center justify-center text-current">
            {leadingIcon}
          </span>
        ) : null}
        <span
          className={cn(
            'min-w-0 flex-1 text-left font-body text-base',
            hideTriggerLabel && 'sr-only',
            selectedItem
              ? 'text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-secondary)]',
          )}
        >
          {displayText}
        </span>
        {!hideChevron ? (
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="ml-2 flex-shrink-0"
          >
            <ChevronDown className="h-4 w-4 text-[var(--color-text-secondary)]" />
          </motion.span>
        ) : null}
      </button>

      <AnimatePresence>
        {open && listboxPosition ? (
          <MenuPortal key="animated-dropdown-listbox">
            <motion.ul
                ref={listboxRef}
                id={`${id ?? 'animated-dropdown'}-listbox`}
                role="listbox"
                aria-label={text}
                data-placement={listboxPosition.placement}
                initial={{ opacity: 0, scale: 0.97, y: listboxPosition.placement === 'above' ? 4 : -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: listboxPosition.placement === 'above' ? 4 : -4 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{
                  position: 'fixed',
                  transformOrigin: listboxPosition.placement === 'above' ? 'bottom' : 'top',
                  top: listboxPosition.top,
                  bottom: listboxPosition.bottom,
                  left: listboxPosition.left,
                  width: listboxPosition.width,
                  maxHeight: listboxPosition.maxHeight,
                }}
                className="z-[10000] max-h-60 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-background-elevated)] py-1 shadow-xl"
                onKeyDown={handleListKeyDown}
                onBlur={handleWidgetBlur}
                onMouseDown={handleListMouseDown}
              >
                {searchable ? (
                  <li
                    role="presentation"
                    className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-background-elevated)] px-3 py-2"
                  >
                    <input
                      ref={searchRef}
                      type="search"
                      role="searchbox"
                      aria-label={searchPlaceholder}
                      aria-controls={`${id ?? 'animated-dropdown'}-listbox`}
                      aria-activedescendant={
                        open && activeIndex >= 0 ? optionDomId(activeIndex) : undefined
                      }
                      value={searchQuery}
                      onChange={handleSearchChange}
                      placeholder={searchPlaceholder}
                      className="h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 font-body text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20"
                      onKeyDown={handleSearchKeyDown}
                      onBlur={handleWidgetBlur}
                    />
                  </li>
                ) : null}
                {visibleItems.map((item, index) => {
                  if (item.header) {
                    return (
                      <li
                        key={`header-${index}-${item.name}`}
                        role="presentation"
                        className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]"
                      >
                        {item.name}
                      </li>
                    );
                  }

                  const val = item.value ?? item.name;
                  const isSelected = selectedValue === val;
                  const isDisabled = item.disabled === true;
                  const isActive = index === activeIndex;
                  return (
                    <li
                      key={`${index}-${val}`}
                      id={optionDomId(index)}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={isDisabled || undefined}
                      data-active={isActive || undefined}
                      onClick={() => {
                        if (isDisabled) {
                          if (onDisabledSelect) {
                            onDisabledSelect(item);
                            closeMenu();
                          }
                          return;
                        }
                        onSelect?.(item);
                        closeMenu();
                      }}
                      className={cn(
                        'px-4 py-2.5 text-sm font-body transition-colors duration-100',
                        item.description ? 'py-3' : 'py-2.5',
                        isDisabled
                          ? cn(
                              'opacity-60',
                              onDisabledSelect
                                ? 'cursor-pointer hover:bg-[var(--color-primary-light)]/10'
                                : 'cursor-not-allowed',
                            )
                          : 'cursor-pointer hover:bg-[var(--color-primary-light)]/20',
                        isSelected
                          ? 'bg-[var(--color-primary-light)]/20 text-coral'
                          : 'text-[var(--color-text-primary)]',
                        isActive && !isSelected && 'bg-[var(--color-primary-light)]/10',
                      )}
                    >
                      {item.description ? (
                        <span className="flex min-w-0 flex-col gap-0.5 text-left">
                          <span className="flex items-center gap-2">
                            <span className="font-medium">{item.name}</span>
                            {item.badge && (
                              <span className="inline-flex rounded-md bg-coral/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-coral">
                                {item.badge}
                              </span>
                            )}
                            {item.icon}
                          </span>
                          <span className="text-sm leading-snug text-[var(--color-text-secondary)]">
                            {item.description}
                          </span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          {item.name}
                          {item.icon}
                        </span>
                      )}
                    </li>
                  );
                })}
            </motion.ul>
          </MenuPortal>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
