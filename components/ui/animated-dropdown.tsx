'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DropdownItem {
  name: string;
  value?: string;
  link?: string;
  description?: string;
  disabled?: boolean;
  badge?: string;
}

interface AnimatedDropdownProps {
  items?: DropdownItem[];
  text?: string;
  className?: string;
  onSelect?: (item: DropdownItem) => void;
  selectedValue?: string;
  id?: string;
  triggerAriaLabel?: string;
}

export function AnimatedDropdown({
  items = [],
  text = 'Select option',
  className,
  onSelect,
  selectedValue,
  id,
  triggerAriaLabel,
}: AnimatedDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedItem = selectedValue
    ? items.find((item) => (item.value ?? item.name) === selectedValue)
    : null;

  const displayText = selectedItem ? selectedItem.name : text;

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Trigger */}
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

      {/* Dropdown list */}
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-label={text}
            initial={{ opacity: 0, scale: 0.97, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-60 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-background-elevated)] py-1 shadow-xl"
          >
            {items.map((item) => {
              const val = item.value ?? item.name;
              const isSelected = selectedValue === val;
              const isDisabled = item.disabled === true;
              return (
                <li
                  key={val}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={isDisabled || undefined}
                  onClick={() => {
                    if (isDisabled) return;
                    onSelect?.(item);
                    setOpen(false);
                  }}
                  className={cn(
                    'px-4 py-2.5 text-sm font-body transition-colors duration-100',
                    item.description ? 'py-3' : 'py-2.5',
                    isDisabled
                      ? 'cursor-not-allowed opacity-60'
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
                      </span>
                      <span className="text-sm leading-snug text-[var(--color-text-secondary)]">
                        {item.description}
                      </span>
                    </span>
                  ) : (
                    item.name
                  )}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
