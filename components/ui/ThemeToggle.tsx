'use client';

import type { CSSProperties, Ref } from 'react';
import { SunIcon } from '@/components/ui/sun';
import { MoonIcon } from '@/components/ui/moon';
import { useTheme } from '@/providers/theme';
import { useMotionSafeIconRef } from '@/hooks/useMotionSafeIconRef';
import { cn } from '@/lib/utils';

type ThemeToggleProps = {
  variant?: 'icon' | 'floating-label';
  className?: string;
  buttonRef?: Ref<HTMLButtonElement>;
  wrapperClassName?: string;
  style?: CSSProperties;
};

export function ThemeToggle({
  variant = 'icon',
  className,
  buttonRef,
  wrapperClassName,
  style,
}: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const iconRef = useMotionSafeIconRef();
  const isDark = resolvedTheme === 'dark';
  const iconSize = variant === 'icon' ? 18 : 16;

  const button = (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        variant === 'icon'
          ? 'relative inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-text-secondary hover:bg-muted hover:text-text-primary transition-[transform,opacity,color,background-color,border-color] active:scale-[0.96]'
          : 'relative btn-shine flex min-h-[44px] items-center gap-2 overflow-hidden rounded-full border border-border bg-surface px-4 py-2.5 font-body text-sm font-medium text-text-primary shadow-lg transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral dark:border-white/25 dark:bg-white/10 dark:text-white dark:hover:bg-white/15',
        className,
      )}
      style={style}
    >
      {isDark ? (
        <>
          <SunIcon
            ref={iconRef}
            size={iconSize}
            className="inline-flex shrink-0 items-center text-current"
          />
          {variant === 'floating-label' ? 'Try light mode' : null}
        </>
      ) : (
        <>
          <MoonIcon
            ref={iconRef}
            size={iconSize}
            className="inline-flex shrink-0 items-center text-current"
          />
          {variant === 'floating-label' ? 'Try dark mode' : null}
        </>
      )}
    </button>
  );

  if (variant === 'floating-label' && wrapperClassName) {
    return <div className={wrapperClassName}>{button}</div>;
  }

  return button;
}
