'use client';

import { useEffect, useRef } from 'react';
import type { CSSProperties, Ref } from 'react';
import { SunIcon } from '@/components/ui/icons/sun';
import { MoonIcon } from '@/components/ui/icons/moon';
import { useTheme } from '@/providers/theme';
import { useT } from '@/providers/locale';
import { useMotionSafeIconRef } from '@/hooks/useMotionSafeIconRef';
import { cn } from '@/lib/utils';

/** Fixed footprint for the landing/pricing theme CTA across locales and light/dark labels. */
export const FLOATING_THEME_TOGGLE_CLASS =
  'h-11 w-[14rem] shrink-0 justify-center whitespace-nowrap';

type ThemeToggleProps = {
  variant?: 'icon' | 'floating-label';
  className?: string;
  buttonRef?: Ref<HTMLButtonElement>;
  wrapperClassName?: string;
  style?: CSSProperties;
};

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (!ref) return;
  if (typeof ref === 'function') {
    ref(value);
  } else {
    ref.current = value;
  }
}

export function ThemeToggle({
  variant = 'icon',
  className,
  buttonRef,
  wrapperClassName,
  style,
}: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useT();
  const { ref: iconRef, animationDisabled } = useMotionSafeIconRef();
  const internalButtonRef = useRef<HTMLButtonElement>(null);
  const isDark = resolvedTheme === 'dark';
  const iconSize = variant === 'icon' ? 18 : 16;

  useEffect(() => {
    if (animationDisabled) return;

    const button = internalButtonRef.current;
    if (!button) return;

    const handleFocusIn = () => {
      iconRef.current?.startAnimation();
    };

    const handleFocusOut = (event: FocusEvent) => {
      if (!button.contains(event.relatedTarget as Node | null)) {
        iconRef.current?.stopAnimation();
      }
    };

    button.addEventListener('focusin', handleFocusIn);
    button.addEventListener('focusout', handleFocusOut);
    return () => {
      button.removeEventListener('focusin', handleFocusIn);
      button.removeEventListener('focusout', handleFocusOut);
    };
  }, [animationDisabled, iconRef]);

  const button = (
    <button
      ref={(node) => {
        internalButtonRef.current = node;
        assignRef(buttonRef, node);
      }}
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? t('landing.switchToLightMode') : t('landing.switchToDarkMode')}
      className={cn(
        variant === 'icon'
          ? 'relative inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-text-secondary hover:bg-muted hover:text-text-primary transition-[transform,opacity,color,background-color,border-color] active:scale-[0.96]'
          : cn(
              'relative btn-shine flex items-center gap-2 overflow-hidden rounded-full border border-border bg-surface px-4 font-body text-sm font-medium text-text-primary shadow-lg transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral dark:border-white/25 dark:bg-white/10 dark:text-white dark:hover:bg-white/15',
              FLOATING_THEME_TOGGLE_CLASS,
            ),
        className,
      )}
      style={style}
    >
      {isDark ? (
        <>
          <SunIcon
            ref={iconRef}
            size={iconSize}
            animationDisabled={animationDisabled}
            aria-hidden
            className="inline-flex shrink-0 items-center text-current"
          />
          {variant === 'floating-label' ? t('landing.tryLightMode') : null}
        </>
      ) : (
        <>
          <MoonIcon
            ref={iconRef}
            size={iconSize}
            animationDisabled={animationDisabled}
            aria-hidden
            className="inline-flex shrink-0 items-center text-current"
          />
          {variant === 'floating-label' ? t('landing.tryDarkMode') : null}
        </>
      )}
    </button>
  );

  if (variant === 'floating-label' && wrapperClassName) {
    return <div className={wrapperClassName}>{button}</div>;
  }

  return button;
}
