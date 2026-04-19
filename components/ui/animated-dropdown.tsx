'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DropdownItem {
  name: string;
  value?: string;
  link?: string;
}

interface AnimatedDropdownProps {
  items?: DropdownItem[];
  text?: string;
  className?: string;
  onSelect?: (item: DropdownItem) => void;
  selectedValue?: string;
  id?: string;
}

export function AnimatedDropdown({
  items = [],
  text = 'Select option',
  className,
  onSelect,
  selectedValue,
  id,
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
              return (
                <li
                  key={val}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onSelect?.(item);
                    setOpen(false);
                  }}
                  className={cn(
                    'cursor-pointer px-4 py-2.5 text-sm font-body transition-colors duration-100',
                    isSelected
                      ? 'bg-[var(--color-primary-light)]/20 text-coral'
                      : 'text-[var(--color-text-primary)] hover:bg-[var(--color-primary-light)]/20',
                  )}
                >
                  {item.name}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
