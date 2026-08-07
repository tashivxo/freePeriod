'use client';

import { useEffect, useRef } from 'react';
import type { CSSProperties, Ref } from 'react';
import { Check } from 'lucide-react';

import { LanguagesIcon } from '@/components/ui/icons/languages';
import { MotionSafeIcon } from '@/components/ui/icons/MotionSafeIcon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LOCALE_LABELS, LOCALES, type Locale } from '@/lib/i18n';
import { useLocale } from '@/providers/locale';
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

export function LanguagePicker({
  variant = 'default',
  className,
  buttonRef,
  wrapperClassName,
  style,
}: LanguagePickerProps) {
  const { locale, setLocale } = useLocale();
  const { ref: iconRef, animationDisabled } = useMotionSafeIconRef();
  const internalButtonRef = useRef<HTMLButtonElement>(null);
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

  const handleSelect = (nextLocale: Locale) => {
    setLocale(nextLocale);
  };

  const button = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          ref={(node) => {
            internalButtonRef.current = node;
            assignRef(buttonRef, node);
          }}
          type="button"
          aria-label="Language"
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
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        {LOCALES.map((code) => (
          <DropdownMenuItem
            key={code}
            className="flex min-h-[44px] items-center justify-between gap-3"
            onSelect={() => handleSelect(code)}
          >
            <span>{LOCALE_LABELS[code]}</span>
            {locale === code ? <Check className="h-4 w-4 shrink-0 text-coral" aria-hidden /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (variant === 'default' && wrapperClassName) {
    return <div className={wrapperClassName}>{button}</div>;
  }

  return button;
}
