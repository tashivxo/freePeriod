'use client';

import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
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
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const visibleItems = useMemo(
    () => (searchable ? filterDropdownItems(items, searchQuery) : items),
    [items, searchable, searchQuery],
  );

  const selectedItem = selectedValue
    ? items.find((item) => !item.header && (item.value ?? item.name) === selectedValue)
    : null;

  const displayText = selectedItem ? selectedItem.name : text;

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      setListboxPosition(
        computeListboxPosition(triggerRef.current, menuAlign, menuMinWidth),
      );
    }
  }, [menuAlign, menuMinWidth]);

  useLayoutEffect(() => {
    if (open) {
      updatePosition();
    } else {
      setListboxPosition(null);
      setSearchQuery('');
    }
  }, [open, updatePosition]);

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
      setOpen(false);
    }

    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open]);

  const listbox =
    open &&
    listboxPosition &&
    typeof document !== 'undefined' &&
    createPortal(
      <AnimatePresence>
        <motion.ul
          ref={listboxRef}
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
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 font-body text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20"
                onKeyDown={(event) => event.stopPropagation()}
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
              return (
                <li
                  key={`${index}-${val}`}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={isDisabled || undefined}
                  onClick={() => {
                    if (isDisabled) {
                      if (onDisabledSelect) {
                        onDisabledSelect(item);
                        setOpen(false);
                      }
                      return;
                    }
                    onSelect?.(item);
                    setOpen(false);
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
      </AnimatePresence>,
      document.body,
    );

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={triggerAriaLabelledBy ? undefined : triggerAriaLabel}
        aria-labelledby={triggerAriaLabelledBy}
        className={cn(
          'h-13 w-full flex items-center justify-between rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-background-elevated)] pl-4 pr-3 font-body text-base transition-colors duration-150 hover:border-coral/60 focus:border-coral focus:ring-2 focus:ring-coral/20 focus:outline-none',
          triggerClassName,
        )}
      >
        <span
          className={cn(
            'flex min-w-0 items-center gap-2 font-body text-base',
            hideTriggerLabel && 'sr-only',
            selectedItem
              ? 'text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-secondary)]',
          )}
        >
          {leadingIcon}
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

      {listbox}
    </div>
  );
}
