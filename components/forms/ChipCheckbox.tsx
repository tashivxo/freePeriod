'use client';

import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type ChipCheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: ReactNode;
  className?: string;
  id?: string;
  'aria-label'?: string;
  'aria-invalid'?: boolean;
};

export function ChipCheckbox({
  checked,
  onCheckedChange,
  children,
  className,
  id,
  'aria-label': ariaLabel,
  'aria-invalid': ariaInvalid,
}: ChipCheckboxProps) {
  return (
    <label
      className={cn(
        'inline-flex min-h-[44px] shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
        'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-coral/40',
        checked
          ? 'border-coral bg-coral text-primary-foreground'
          : 'border-border bg-background text-text-primary hover:border-coral',
        className,
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid || undefined}
        className="sr-only"
      />
      {checked ? <Check aria-hidden className="size-3.5" /> : null}
      {children}
    </label>
  );
}
