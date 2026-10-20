'use client';

import { useState, type CSSProperties } from 'react';
import { AnimatedDropdown } from '@/components/ui/animated-dropdown';
import { LanguagesIcon } from '@/components/ui/icons/languages';
import { isLocale, LOCALE_LABELS, LOCALES } from '@/lib/i18n';
import { useLocale, useT } from '@/providers/locale';
import { useMotionSafeIconRef } from '@/hooks/useMotionSafeIconRef';
import { cn } from '@/lib/utils';

type LanguagePickerProps = {
  variant?: 'icon' | 'default';
  className?: string;
  wrapperClassName?: string;
  style?: CSSProperties;
};

const LOCALE_ITEMS = LOCALES.map((code) => ({
  name: LOCALE_LABELS[code],
  value: code,
}));

export function LanguagePicker({
  variant = 'default',
  className,
  wrapperClassName,
  style,
}: LanguagePickerProps) {
  const { locale, setLocale } = useLocale();
  const t = useT();
  const { ref: iconRef, animationDisabled } = useMotionSafeIconRef();
  const iconSize = variant === 'icon' ? 18 : 16;
  const [persistError, setPersistError] = useState<string | null>(null);

  const picker = (
    <AnimatedDropdown
      id="language-picker"
      className={cn('w-auto', wrapperClassName ? undefined : className)}
      text={t('settings.language')}
      items={LOCALE_ITEMS}
      selectedValue={locale}
      triggerAriaLabel={t('settings.language')}
      menuAlign="end"
      menuMinWidth={160}
      hideChevron={variant === 'icon'}
      hideTriggerLabel={variant === 'icon'}
      leadingIcon={
        <LanguagesIcon
          ref={iconRef}
          size={iconSize}
          animationDisabled={animationDisabled}
          aria-hidden
          className="inline-flex shrink-0 items-center text-current"
        />
      }
      triggerClassName={cn(
        variant === 'icon'
          ? 'relative inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background px-0 text-text-secondary hover:bg-muted hover:text-text-primary transition-[transform,opacity,color,background-color,border-color] dark:border-white/25 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 dark:hover:text-white'
          : 'relative inline-flex min-h-[44px] w-auto items-center gap-2 overflow-hidden rounded-xl border border-border bg-background px-4 py-2.5 font-body text-sm font-medium text-text-primary transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral dark:border-white/25 dark:bg-white/10 dark:text-white dark:hover:bg-white/15',
        className,
      )}
      onSelect={(item) => {
        const nextLocale = item.value ?? item.name;
        if (isLocale(nextLocale)) {
          setPersistError(null);
          void setLocale(nextLocale).catch(() => {
            setPersistError(t('settings.saveFailed'));
          });
        }
      }}
    />
  );

  const content = (
    <>
      {picker}
      {persistError ? (
        <p role="alert" className="mt-2 font-body text-sm text-error">
          {persistError}
        </p>
      ) : null}
    </>
  );

  if (wrapperClassName) {
    return (
      <div className={wrapperClassName} style={style}>
        {content}
      </div>
    );
  }

  return <div style={style}>{content}</div>;
}
