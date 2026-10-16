export const LOCALES = ['en', 'ar', 'es', 'fr', 'zh-Hans'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
  es: 'Español',
  fr: 'Français',
  'zh-Hans': '简体中文',
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function isRtl(locale: Locale): boolean {
  return locale === 'ar';
}

export const LOCALE_STORAGE_KEY = 'fp-locale';

export function hasStoredLocale(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && isLocale(stored)) return true;
  } catch {
    // Ignore quota / private-mode storage failures.
  }
  const match = document.cookie.match(/(?:^|;\s*)fp-locale=([^;]*)/);
  if (!match?.[1]) return false;
  try {
    return isLocale(decodeURIComponent(match[1]));
  } catch {
    return false;
  }
}
