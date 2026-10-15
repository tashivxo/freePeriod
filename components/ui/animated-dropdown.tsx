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
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/** ~15rem — matches Tailwind `max-h-60` */
const LIST_MAX_HEIGHT_PX = 240;
const TRIGGER_GAP_PX = 4;
const VIEWPORT_PADDING_PX = 8;
const FLIP_TO_ABOVE_MIN_BELOW_PX = 120;
const PLACEMENT_HYSTERESIS_PX = 48;
const LISTBOX_EASE = [0.16, 1, 0.3, 1] as const;

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

function computeListboxPosition(
  trigger: HTMLElement,
  lastPlacement: ListboxPlacement | null = null,
): ListboxPosition {
  const rect = trigger.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom - TRIGGER_GAP_PX - VIEWPORT_PADDING_PX;
  const spaceAbove = rect.top - TRIGGER_GAP_PX - VIEWPORT_PADDING_PX;

  let placement: ListboxPlacement;
  if (lastPlacement === 'below') {
    placement =
      spaceBelow < FLIP_TO_ABOVE_MIN_BELOW_PX && spaceAbove > spaceBelow + PLACEMENT_HYSTERESIS_PX
        ? 'above'
        : 'below';
  } else if (lastPlacement === 'above') {
    placement = spaceBelow > spaceAbove + PLACEMENT_HYSTERESIS_PX ? 'below' : 'above';
  } else {
    placement = 'below';
    if (spaceBelow < LIST_MAX_HEIGHT_PX && spaceAbove > spaceBelow) {
      placement = 'above';
    }
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

function applyPositionToShell(shell: HTMLElement, position: ListboxPosition) {
  shell.style.top = `${position.top}px`;
  shell.style.left = `${position.left}px`;
  shell.style.width = `${position.width}px`;
  shell.style.maxHeight = `${position.maxHeight}px`;
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
  const [mounted, setMounted] = useState(false);
  const [listboxPosition, setListboxPosition] = useState<ListboxPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const lastPlacementRef = useRef<ListboxPlacement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const openRef = useRef(open);
  const prefersReducedMotion = useReducedMotion();

  openRef.current = open;

  const selectedItem = selectedValue
    ? items.find((item) => !item.header && (item.value ?? item.name) === selectedValue)
    : null;

  const displayText = selectedItem ? selectedItem.name : text;
  const offsetY = prefersReducedMotion ? 0 : -4;

  const handleExitComplete = useCallback(() => {
    if (openRef.current) return;
    setMounted(false);
    setListboxPosition(null);
    lastPlacementRef.current = null;
  }, []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    lastPlacementRef.current = null;
    const position = computeListboxPosition(triggerRef.current, null);
    lastPlacementRef.current = position.placement;
    setListboxPosition(position);
    setMounted(true);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const schedulePositionFrame = () => {
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        const trigger = triggerRef.current;
        const shell = shellRef.current;
        if (!trigger || !shell) return;
        const position = computeListboxPosition(trigger, lastPlacementRef.current);
        lastPlacementRef.current = position.placement;
        applyPositionToShell(shell, position);
      });
    };

    const handleScroll = (event: Event) => {
      const target = event.target;
      if (target instanceof Node && listboxRef.current?.contains(target)) {
        return;
      }
      schedulePositionFrame();
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', schedulePositionFrame);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', schedulePositionFrame);
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [open]);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        shellRef.current?.contains(target) ||
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

  // If the exit animation never completes (common in jsdom), drop the portal
  // shortly after close so the menu cannot stick open.
  useEffect(() => {
    if (open || !mounted) return;
    const timeoutId = window.setTimeout(() => {
      setMounted(false);
      setListboxPosition(null);
      lastPlacementRef.current = null;
    }, 180);
    return () => window.clearTimeout(timeoutId);
  }, [open, mounted]);

  const listbox =
    mounted &&
    listboxPosition &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        ref={shellRef}
        data-testid="dropdown-listbox-shell"
        aria-hidden={open ? undefined : true}
        style={{
          position: 'fixed',
          top: listboxPosition.top,
          left: listboxPosition.left,
          width: listboxPosition.width,
          maxHeight: listboxPosition.maxHeight,
          zIndex: 10000,
        }}
      >
        <AnimatePresence onExitComplete={handleExitComplete}>
          {open && (
            <motion.ul
              key="dropdown-listbox"
              ref={listboxRef}
              role="listbox"
              aria-label={text}
              initial={{ opacity: 0, y: offsetY }}
              animate={{ opacity: 1, y: 0 }}
              exit={{
                opacity: 0,
                y: offsetY,
                transition: { type: 'tween', duration: 0.1, ease: LISTBOX_EASE },
              }}
              transition={{ type: 'tween', duration: 0.16, ease: LISTBOX_EASE }}
              style={{ willChange: 'transform, opacity', maxHeight: 'inherit' }}
              className="z-[10000] max-h-60 w-full overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-background-elevated)] py-1 shadow-xl"
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
                      'min-h-11 px-4 py-2.5 text-sm font-body transition-colors duration-100',
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
          )}
        </AnimatePresence>
      </div>,
      document.body,
    );

  return (
    <div className={cn('relative w-full', className)}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={triggerAriaLabel}
        className={cn(
          'h-13 w-full flex items-center justify-between rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-background-elevated)] pl-4 pr-3 font-body text-base transition-[color,background-color,border-color,transform] duration-150 hover:border-coral/60 focus:border-coral focus:ring-2 focus:ring-coral/20 focus:outline-none',
          !prefersReducedMotion && 'active:scale-[0.96]',
        )}
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
        {prefersReducedMotion ? (
          <span className={cn('ml-2 flex-shrink-0', open && 'rotate-180')}>
            <ChevronDown className="h-4 w-4 text-[var(--color-text-secondary)]" />
          </span>
        ) : (
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="ml-2 flex-shrink-0"
          >
            <ChevronDown className="h-4 w-4 text-[var(--color-text-secondary)]" />
          </motion.span>
        )}
      </button>

      {listbox}
    </div>
  );
}
