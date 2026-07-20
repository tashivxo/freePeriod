'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Lock, Sparkles, Zap, type LucideIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type GenerationMode = 'fast' | 'quality';

export const GENERATION_MODE_OPTIONS = [
  {
    value: 'fast' as const,
    label: 'Fast',
    description: 'Quicker plans for everyday lessons.',
    Icon: Zap,
  },
  {
    value: 'quality' as const,
    label: 'Quality',
    description: 'More thorough plans. Takes a bit longer.',
    Icon: Sparkles,
  },
] as const;

type GenerationModePickerProps = {
  id: string;
  value: GenerationMode;
  onChange: (mode: GenerationMode) => void;
  qualityUnlocked: boolean;
};

function getCloseDurationMs(): number {
  if (typeof window === 'undefined') return 150;
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--dropdown-close-dur');
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : 150;
}

export function GenerationModePicker({
  id,
  value,
  onChange,
  qualityUnlocked,
}: GenerationModePickerProps) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const upgradeHintId = useId();

  const selected =
    GENERATION_MODE_OPTIONS.find((option) => option.value === value) ??
    GENERATION_MODE_OPTIONS[0];
  const SelectedIcon = selected.Icon;

  const syncDropdownClasses = useCallback((isOpen: boolean) => {
    const el = contentRef.current;
    if (!el) return;

    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (isOpen) {
      el.classList.remove('is-closing');
      el.classList.add('is-open');
      return;
    }

    el.classList.remove('is-open');
    el.classList.add('is-closing');
    closeTimerRef.current = setTimeout(() => {
      el.classList.remove('is-closing');
      closeTimerRef.current = null;
    }, getCloseDurationMs());
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      syncDropdownClasses(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      syncDropdownClasses(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [open, syncDropdownClasses]);

  const handleValueChange = (nextValue: string) => {
    if (nextValue === 'fast' || nextValue === 'quality') {
      onChange(nextValue);
    }
  };

  return (
    <div>
      <DropdownMenu open={open} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            id={id}
            aria-label={`Generation mode: ${selected.label}. ${selected.description}`}
            aria-haspopup="menu"
            aria-expanded={open}
            className={cn(
              'flex h-13 w-full items-center justify-between gap-3 rounded-xl border-2',
              'border-[var(--color-border)] bg-[var(--color-background-elevated)] px-4 py-2 font-body text-base',
              'transition-[transform,border-color,box-shadow] duration-150',
              'hover:border-coral/60 focus-visible:border-coral focus-visible:outline-none',
              'focus-visible:ring-2 focus-visible:ring-coral/20 active:scale-[0.96]',
              'data-[state=open]:border-coral/60 data-[state=open]:ring-2 data-[state=open]:ring-coral/20',
            )}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-lg',
                  value === 'quality' ? 'bg-coral/15 text-coral' : 'bg-muted text-text-secondary',
                )}
              >
                <SelectedIcon className="size-4" aria-hidden />
              </span>
              <span className="min-w-0 text-left">
                <span className="block truncate font-medium leading-tight text-text-primary">
                  {selected.label}
                </span>
                <span className="block truncate text-sm leading-snug text-text-secondary">
                  {selected.description}
                </span>
              </span>
            </span>
            <ChevronDown
              className={cn(
                'size-4 shrink-0 text-text-secondary transition-transform duration-200',
                open && 'rotate-180',
              )}
              aria-hidden
            />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          ref={contentRef}
          align="start"
          sideOffset={6}
          data-origin="top-left"
          className={cn(
            't-dropdown min-w-[var(--radix-dropdown-menu-trigger-width)] p-1.5',
            'rounded-xl border border-border bg-background/95 text-popover-foreground backdrop-blur-md',
            'shadow-xl ring-1 ring-foreground/10',
            'data-open:animate-none data-closed:animate-none',
          )}
        >
          <DropdownMenuRadioGroup value={value} onValueChange={handleValueChange}>
            {GENERATION_MODE_OPTIONS.map((option) => (
              <ModeMenuItem
                key={option.value}
                option={option}
                disabled={option.value === 'quality' && !qualityUnlocked}
                describedBy={
                  option.value === 'quality' && !qualityUnlocked ? upgradeHintId : undefined
                }
                showProBadge={option.value === 'quality' && !qualityUnlocked}
              />
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {!qualityUnlocked && (
        <p id={upgradeHintId} className="mt-2 text-sm font-body text-text-secondary">
          <Link href="/pricing" className="text-coral underline-offset-2 hover:underline">
            Upgrade to Pro
          </Link>{' '}
          to unlock Quality mode.
        </p>
      )}
    </div>
  );
}

function ModeMenuItem({
  option,
  disabled,
  describedBy,
  showProBadge,
}: {
  option: (typeof GENERATION_MODE_OPTIONS)[number];
  disabled?: boolean;
  describedBy?: string;
  showProBadge?: boolean;
}) {
  const Icon: LucideIcon = option.Icon;

  return (
    <DropdownMenuRadioItem
      value={option.value}
      disabled={disabled}
      aria-describedby={describedBy}
      className={cn(
        'items-start rounded-lg py-2.5 pl-3 pr-8',
        'focus:bg-coral/10 data-[state=checked]:bg-coral/10',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <span className="flex items-start gap-2.5">
        <span
          className={cn(
            'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md',
            option.value === 'quality' ? 'bg-coral/15 text-coral' : 'bg-muted text-text-secondary',
          )}
        >
          <Icon className="size-3.5" aria-hidden />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5 text-left">
          <span className="flex items-center gap-2">
            <span className="font-medium text-text-primary">{option.label}</span>
            {showProBadge && (
              <span className="inline-flex items-center gap-1 rounded-md bg-coral/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-coral">
                <Lock className="size-2.5" aria-hidden />
                Pro
              </span>
            )}
          </span>
          <span className="text-sm leading-snug text-text-secondary">{option.description}</span>
        </span>
      </span>
    </DropdownMenuRadioItem>
  );
}
