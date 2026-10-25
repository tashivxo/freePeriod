'use client';

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';

import {
  DEFAULT_LOCALE,
  getMessages,
  isLocale,
  isRtl,
  LOCALE_STORAGE_KEY,
  type Locale,
  type Messages,
} from '@/lib/i18n';
import { createT } from '@/lib/i18n/format';
import { createClient } from '@/lib/supabase/client';

const STORAGE_KEY = LOCALE_STORAGE_KEY;
const COOKIE_MAX_AGE = 31536000;

type TranslateVars = Record<string, string>;

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  messages: Messages;
  dir: 'ltr' | 'rtl';
  t: (key: string, vars?: TranslateVars) => string;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: async () => {},
  messages: getMessages(DEFAULT_LOCALE),
  dir: 'ltr',
  t: (key) => key,
});

function applyDocumentLocale(locale: Locale) {
  document.documentElement.lang = locale;
  document.documentElement.dir = isRtl(locale) ? 'rtl' : 'ltr';
}

export function LocaleProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  // Always hydrate from the server cookie locale so SSR HTML matches the first client render.
  // Bootstrap may set document.lang from localStorage when the cookie is missing; sync after paint.
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useLayoutEffect(() => {
    const documentLocale = document.documentElement.lang;
    if (isLocale(documentLocale) && documentLocale !== initialLocale) {
      setLocaleState(documentLocale);
      localStorage.setItem(STORAGE_KEY, documentLocale);
      document.cookie = `${STORAGE_KEY}=${encodeURIComponent(documentLocale)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    }
  }, [initialLocale]);

  const setLocale = useCallback(async (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    localStorage.setItem(STORAGE_KEY, nextLocale);
    document.cookie = `${STORAGE_KEY}=${encodeURIComponent(nextLocale)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    applyDocumentLocale(nextLocale);

    const supabase = createClient();
    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser();
    if (sessionError) {
      console.error('[locale] Could not save preferred locale, session is unavailable', sessionError);
      throw sessionError;
    }
    if (!user) return;

    const { error } = await supabase
      .from('users')
      .update({ preferred_locale: nextLocale })
      .eq('id', user.id);
    if (error) throw error;
  }, []);

  const messages = useMemo(() => getMessages(locale), [locale]);
  const dir: 'ltr' | 'rtl' = isRtl(locale) ? 'rtl' : 'ltr';
  const t = useMemo(() => createT(locale), [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, messages, dir, t }),
    [locale, setLocale, messages, dir, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function useT() {
  return useContext(LocaleContext).t;
}
