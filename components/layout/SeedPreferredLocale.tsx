'use client';

import { useEffect } from 'react';
import { hasStoredLocale, isLocale } from '@/lib/i18n';
import { useLocale } from '@/providers/locale';

export function SeedPreferredLocale({ locale }: { locale?: string | null }) {
  const { locale: current, setLocale } = useLocale();

  useEffect(() => {
    if (!locale || !isLocale(locale) || hasStoredLocale()) return;
    if (locale === current) return;
    void setLocale(locale);
  }, [locale, current, setLocale]);

  return null;
}
