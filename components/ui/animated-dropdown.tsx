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
const MIN_LIST_MAX_HEIGHT_PX = 120;
const OPEN_SCROLL_THRESHOLD_PX = 280;

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

interface ListboxPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
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

function spaceBelowTrigger(trigger: HTMLElement): number {
  const rect = trigger.getBoundingClientRect();
  return window.innerHeight - rect.bottom - TRIGGER_GAP_PX - VIEWPORT_PADDING_PX;
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

function computeListboxPosition(
  trigger: HTMLElement,
  menuAlign: 'stretch' | 'end',
  menuMinWidth: number,
): ListboxPosition {
  const rect = trigger.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom - TRIGGER_GAP_PX - VIEWPORT_PADDING_PX;
  const maxHeight =
    spaceBelow >= MIN_LIST_MAX_HEIGHT_PX
      ? Math.min(LIST_MAX_HEIGHT_PX, Math.max(spaceBelow, 0))
      : Math.min(MIN_LIST_MAX_HEIGHT_PX, Math.max(spaceBelow, MIN_LIST_MAX_HEIGHT_PX));

  const width = Math.max(rect.width, menuMinWidth);
  const left = menuAlign === 'end' ? rect.right - width : rect.left;

  return {
    top: rect.bottom + TRIGGER_GAP_PX,
    left,
    width,
    maxHeight,
  };
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
    setListboxPosition(computeListboxPosition(trigger, menuAlign, menuMinWidth));
  }, [menuAlign, menuMinWidth]);

  const closeMenu = useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) {
      triggerRef.current?.focus();
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
    (index: number) => {
      if (index < 0) return;
      const optionId = optionDomId(index);
      const scroll = () => {
        document.getElementById(optionId)?.scrollIntoView({ block: 'nearest' });
      };
      if (document.getElementById(optionId)) {
        scroll();
        return;
      }
      requestAnimationFrame(scroll);
    },
    [optionDomId],
  );

  const openMenu = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    if (spaceBelowTrigger(trigger) < OPEN_SCROLL_THRESHOLD_PX) {
      trigger.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
    }

    const highlight = highlightIndexOnOpen(items, selectedValue);
    setSearchQuery('');
    setListboxPosition(computeListboxPosition(trigger, menuAlign, menuMinWidth));
    setActiveIndex(highlight);
    setOpen(true);
    scrollOptionIntoView(highlight);
  }, [items, menuAlign, menuMinWidth, scrollOptionIntoView, selectedValue]);

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
          triggerRef.current?.focus();
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
      scrollOptionIntoView(nextActive);
    },
    [items, scrollOptionIntoView, selectedValue],
  );

  useEffect(() => {
    if (!open) return;

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (open && searchable) {
      searchRef.current?.focus();
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
          'h-13 w-full flex items-center justify-between gap-2 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-background-elevated)] pl-4 pr-3 font-body text-base hover:border-coral/60 focus:border-coral focus:ring-2 focus:ring-coral/20 focus:outline-none',
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
                initial={{ opacity: 0, scale: 0.97, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: -4 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{
                  position: 'fixed',
                  top: listboxPosition.top,
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
