'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ChipRadioProps = {
  checked: boolean;
  onSelect: () => void;
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
  'aria-invalid'?: boolean;
};

export function ChipRadio({
  checked,
  onSelect,
  children,
  className,
  'aria-label': ariaLabel,
  'aria-invalid': ariaInvalid,
}: ChipRadioProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-invalid={ariaInvalid || undefined}
      onClick={onSelect}
      className={cn(
        'min-h-[44px] shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
        checked
          ? 'border-primary bg-primary text-white'
          : 'border-border bg-background text-text-primary hover:border-coral',
        className,
      )}
    >
      {children}
    </button>
  );
}
