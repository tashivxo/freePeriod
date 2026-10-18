import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/lib/i18n/locales';

export async function readLocaleCookie(): Promise<Locale> {
  const raw = (await cookies()).get('fp-locale')?.value;
  if (!raw) return DEFAULT_LOCALE;
  try {
    const decoded = decodeURIComponent(raw);
    return isLocale(decoded) ? decoded : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}
