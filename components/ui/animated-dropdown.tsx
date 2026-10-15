'use client';

import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
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
}

type ListboxPlacement = 'below' | 'above';

interface ListboxPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: ListboxPlacement;
}

function computeListboxPosition(trigger: HTMLElement): ListboxPosition {
  const rect = trigger.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom - TRIGGER_GAP_PX - VIEWPORT_PADDING_PX;
  const spaceAbove = rect.top - TRIGGER_GAP_PX - VIEWPORT_PADDING_PX;

  let placement: ListboxPlacement = 'below';
  if (spaceBelow < LIST_MAX_HEIGHT_PX && spaceAbove > spaceBelow) {
    placement = 'above';
  }

  const available = placement === 'below' ? spaceBelow : spaceAbove;
  const maxHeight = Math.min(
    LIST_MAX_HEIGHT_PX,
    Math.max(available, 0),
  );

  const top =
    placement === 'below'
      ? rect.bottom + TRIGGER_GAP_PX
      : Math.max(VIEWPORT_PADDING_PX, rect.top - TRIGGER_GAP_PX - maxHeight);

  return {
    top,
    left: rect.left,
    width: rect.width,
    maxHeight,
    placement,
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
}: AnimatedDropdownProps) {
  const [open, setOpen] = useState(false);
  const [listboxPosition, setListboxPosition] = useState<ListboxPosition | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const selectedItem = selectedValue
    ? items.find((item) => !item.header && (item.value ?? item.name) === selectedValue)
    : null;

  const displayText = selectedItem ? selectedItem.name : text;

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      setListboxPosition(computeListboxPosition(triggerRef.current));
    }
  }, []);

  useLayoutEffect(() => {
    if (open) {
      updatePosition();
    } else {
      setListboxPosition(null);
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
    function handleOutsideClick(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || listboxRef.current?.contains(target)) {
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
          {items.map((item, index) => {
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
    <div ref={triggerRef} className={cn('relative w-full', className)}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={triggerAriaLabel}
        className="h-13 w-full flex items-center justify-between rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-background-elevated)] pl-4 pr-3 font-body text-base transition-colors duration-150 hover:border-coral/60 focus:border-coral focus:ring-2 focus:ring-coral/20 focus:outline-none"
      >
        <span
          className={cn(
            'font-body text-base',
            selectedItem
              ? 'text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-secondary)]',
          )}
        >
          {displayText}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="ml-2 flex-shrink-0"
        >
          <ChevronDown className="h-4 w-4 text-[var(--color-text-secondary)]" />
        </motion.span>
      </button>

      {listbox}
    </div>
  );
}
