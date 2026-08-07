import type { Locale } from '@/lib/i18n/locales';
import { ar } from './ar';
import { en } from './en';
import type { Messages } from './en';
import { es } from './es';
import { fr } from './fr';

export type { Messages };

const MESSAGES: Record<Locale, Messages> = {
  en,
  ar,
  es,
  fr,
};

export function getMessages(locale: Locale): Messages {
  return MESSAGES[locale];
}
