'use client';

import { useEffect, useRef } from 'react';
import type { CSSProperties, Ref } from 'react';
import { SunIcon } from '@/components/ui/icons/sun';
import { MoonIcon } from '@/components/ui/icons/moon';
import { TextSwap } from '@/components/ui/TextSwap';
import { useTheme } from '@/providers/theme';
import { useLocale, useT } from '@/providers/locale';
import { useMotionSafeIconRef } from '@/hooks/useMotionSafeIconRef';
import { cn } from '@/lib/utils';

/** Fixed footprint for the landing/pricing theme CTA across locales and light/dark labels. */
export const FLOATING_THEME_TOGGLE_CLASS =
  'h-11 w-[16rem] max-w-[calc(100vw-2rem)] shrink-0 justify-center whitespace-nowrap';

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
  const { locale } = useLocale();
  const t = useT();
  const { ref: sunRef, animationDisabled } = useMotionSafeIconRef();
  const { ref: moonRef } = useMotionSafeIconRef();
  const internalButtonRef = useRef<HTMLButtonElement>(null);
  const isDark = resolvedTheme === 'dark';
  const iconSize = variant === 'icon' ? 18 : 16;
  const label = isDark ? t('landing.tryLightMode') : t('landing.tryDarkMode');

  useEffect(() => {
    if (animationDisabled) return;

    const button = internalButtonRef.current;
    if (!button) return;

    const handleFocusIn = () => {
      (isDark ? sunRef : moonRef).current?.startAnimation();
    };

    const handleFocusOut = (event: FocusEvent) => {
      if (!button.contains(event.relatedTarget as Node | null)) {
        sunRef.current?.stopAnimation();
        moonRef.current?.stopAnimation();
      }
    };

    button.addEventListener('focusin', handleFocusIn);
    button.addEventListener('focusout', handleFocusOut);
    return () => {
      button.removeEventListener('focusin', handleFocusIn);
      button.removeEventListener('focusout', handleFocusOut);
    };
  }, [animationDisabled, isDark, moonRef, sunRef]);

  const button = (
    <button
      ref={(node) => {
        internalButtonRef.current = node;
        assignRef(buttonRef, node);
      }}
      type="button"
      suppressHydrationWarning
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? t('landing.switchToLightMode') : t('landing.switchToDarkMode')}
      className={cn(
        variant === 'icon'
          ? 'relative inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-text-secondary hover:bg-muted hover:text-text-primary transition-[transform,opacity,color,background-color,border-color] active:scale-[0.96]'
          : cn(
              'relative btn-shine flex items-center gap-2 overflow-hidden rounded-full border border-border bg-surface px-4 font-body text-sm font-medium text-text-primary shadow-lg transition-[color,background-color,border-color] hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral dark:border-white/25 dark:bg-white/10 dark:text-white dark:hover:bg-white/15',
              FLOATING_THEME_TOGGLE_CLASS,
            ),
        className,
      )}
      style={style}
    >
      <span
        className="t-icon-swap inline-flex shrink-0 items-center justify-center"
        data-state={isDark ? 'b' : 'a'}
        aria-hidden
      >
        <span className="t-icon" data-icon="a">
          <MoonIcon
            ref={moonRef}
            size={iconSize}
            animationDisabled={animationDisabled}
            aria-hidden
            className="inline-flex shrink-0 items-center text-current"
          />
        </span>
        <span className="t-icon" data-icon="b">
          <SunIcon
            ref={sunRef}
            size={iconSize}
            animationDisabled={animationDisabled}
            aria-hidden
            className="inline-flex shrink-0 items-center text-current"
          />
        </span>
      </span>
      {variant === 'floating-label' ? (
        <TextSwap swapKey={`${resolvedTheme}-${locale}`} className="truncate">
          {label}
        </TextSwap>
      ) : null}
    </button>
  );

  if (variant === 'floating-label' && wrapperClassName) {
    return <div className={wrapperClassName}>{button}</div>;
  }

  return button;
}
