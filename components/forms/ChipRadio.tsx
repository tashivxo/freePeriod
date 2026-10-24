'use client';

import { useLayoutEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type ChipRadioProps = {
  checked: boolean;
  onSelect: () => void;
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
  'aria-invalid'?: boolean;
};

const ARROW_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);

function readingDirection(element: Element): 'ltr' | 'rtl' {
  let current: Element | null = element;
  while (current) {
    const dir = current.getAttribute('dir');
    if (dir === 'rtl' || dir === 'ltr') return dir;
    current = current.parentElement;
  }
  return document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr';
}

function radiosInGroup(radio: HTMLElement): HTMLElement[] {
  const group = radio.closest('[role="radiogroup"]');
  if (!group) return [radio];
  return Array.from(group.querySelectorAll<HTMLElement>('[role="radio"]'));
}

export function ChipRadio({
  checked,
  onSelect,
  children,
  className,
  'aria-label': ariaLabel,
  'aria-invalid': ariaInvalid,
}: ChipRadioProps) {
  const ref = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const radios = radiosInGroup(node);
    const anyChecked = radios.some((item) => item.getAttribute('aria-checked') === 'true');
    if (!anyChecked && radios[0] === node) {
      node.tabIndex = 0;
    }
  }, [checked]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!ARROW_KEYS.has(event.key)) return;
    const node = ref.current;
    if (!node) return;

    const radios = radiosInGroup(node);
    const index = radios.indexOf(node);
    if (index < 0) return;

    const rtl = readingDirection(node.closest('[role="radiogroup"]') ?? node) === 'rtl';
    const goingNext =
      event.key === 'ArrowDown' || event.key === (rtl ? 'ArrowLeft' : 'ArrowRight');
    const goingPrev =
      event.key === 'ArrowUp' || event.key === (rtl ? 'ArrowRight' : 'ArrowLeft');
    if (!goingNext && !goingPrev) return;

    event.preventDefault();
    const nextIndex = goingNext
      ? (index + 1) % radios.length
      : (index - 1 + radios.length) % radios.length;
    const next = radios[nextIndex];
    next?.focus();
    next?.click();
  }

  return (
    <button
      ref={ref}
      type="button"
      role="radio"
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-invalid={ariaInvalid || undefined}
      tabIndex={checked ? 0 : -1}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className={cn(
        'inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
        checked
          ? 'border-coral bg-coral text-primary-foreground'
          : 'border-border bg-background text-text-primary hover:border-coral',
        className,
      )}
    >
      {checked ? <Check aria-hidden className="size-3.5" /> : null}
      {children}
    </button>
  );
}
