'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, Ref } from 'react';
import { Check } from 'lucide-react';

import { LanguagesIcon } from '@/components/ui/icons/languages';
import { LOCALE_LABELS, LOCALES, type Locale } from '@/lib/i18n';
import { DROPDOWN_MOTION } from '@/lib/motion/tokens';
import { useLocale, useT } from '@/providers/locale';
import { useMotionSafeIconRef } from '@/hooks/useMotionSafeIconRef';
import { cn } from '@/lib/utils';

type LanguagePickerProps = {
  variant?: 'icon' | 'default';
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

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function LanguagePicker({
  variant = 'default',
  className,
  buttonRef,
  wrapperClassName,
  style,
}: LanguagePickerProps) {
  const { locale, setLocale, dir } = useLocale();
  const t = useT();
  const { ref: iconRef, animationDisabled } = useMotionSafeIconRef();
  const internalButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const iconSize = variant === 'icon' ? 18 : 16;
  const menuId = useId();

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const reduced = prefersReducedMotion();
  const origin = dir === 'rtl' ? 'top-left' : 'top-right';

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

  useLayoutEffect(() => {
    if (!mounted || closing || reduced) return;
    const frame = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(frame);
  }, [mounted, closing, reduced]);

  useEffect(() => {
    if (!mounted) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (internalButtonRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      closeMenu();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        internalButtonRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mounted]);

  function closeMenu() {
    if (!mounted) return;
    if (prefersReducedMotion()) {
      setOpen(false);
      setClosing(false);
      setMounted(false);
      return;
    }
    setOpen(false);
    setClosing(true);
    window.setTimeout(() => {
      setClosing(false);
      setMounted(false);
    }, DROPDOWN_MOTION.closeMs);
  }

  function openMenu() {
    if (prefersReducedMotion()) {
      setMounted(true);
      setClosing(false);
      setOpen(true);
      return;
    }
    setClosing(false);
    setOpen(false);
    setMounted(true);
  }

  function handleSelect(nextLocale: Locale) {
    setLocale(nextLocale);
    closeMenu();
    internalButtonRef.current?.focus();
  }

  const menuVisible = mounted || closing;

  const picker = (
    <div className="relative">
      <button
        ref={(node) => {
          internalButtonRef.current = node;
          assignRef(buttonRef, node);
        }}
        type="button"
        aria-label={t('settings.language')}
        aria-haspopup="menu"
        aria-expanded={open && !closing}
        aria-controls={menuVisible ? menuId : undefined}
        onClick={() => {
          if (open && !closing) {
            closeMenu();
          } else {
            openMenu();
          }
        }}
        className={cn(
          variant === 'icon'
            ? 'relative inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-text-secondary hover:bg-muted hover:text-text-primary transition-[transform,opacity,color,background-color,border-color] active:scale-[0.96]'
            : 'relative inline-flex min-h-[44px] items-center gap-2 overflow-hidden rounded-xl border border-border bg-background px-4 py-2.5 font-body text-sm font-medium text-text-primary transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral',
          className,
        )}
        style={style}
      >
        <LanguagesIcon
          ref={iconRef}
          size={iconSize}
          animationDisabled={animationDisabled}
          aria-hidden
          className="inline-flex shrink-0 items-center text-current"
        />
        {variant === 'default' ? (
          <span className="truncate">{LOCALE_LABELS[locale]}</span>
        ) : null}
      </button>
      {menuVisible ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={t('settings.language')}
          data-origin={origin}
          data-side="bottom"
          data-align="end"
          className={cn(
            't-dropdown absolute top-[calc(100%+4px)] end-0 z-50 min-w-[10rem] rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10',
            open && !closing && 'is-open',
            closing && 'is-closing',
          )}
        >
          {LOCALES.map((code) => {
            const selected = locale === code;
            return (
              <button
                key={code}
                type="button"
                role="menuitem"
                aria-current={selected ? 'true' : undefined}
                className={cn(
                  'flex min-h-[44px] w-full items-center justify-between gap-3 rounded-md px-1.5 py-1 text-start text-sm outline-hidden',
                  'focus:bg-[var(--color-primary-light)]/20 focus:text-text-primary',
                  'hover:bg-[var(--color-primary-light)]/20 hover:text-text-primary',
                  selected && 'bg-[var(--color-primary-light)]/20 text-coral',
                )}
                onClick={() => handleSelect(code)}
              >
                <span>{LOCALE_LABELS[code]}</span>
                {selected ? (
                  <Check className="h-4 w-4 shrink-0 text-coral" aria-hidden />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );

  if (wrapperClassName) {
    return <div className={wrapperClassName}>{picker}</div>;
  }

  return picker;
}
