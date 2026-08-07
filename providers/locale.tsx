'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import {
  DEFAULT_LOCALE,
  getMessages,
  isLocale,
  isRtl,
  type Locale,
  type Messages,
} from '@/lib/i18n';

const STORAGE_KEY = 'fp-locale';

type TranslateVars = Record<string, string>;

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  messages: Messages;
  dir: 'ltr' | 'rtl';
  t: (key: string, vars?: TranslateVars) => string;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  messages: getMessages(DEFAULT_LOCALE),
  dir: 'ltr',
  t: (key) => key,
});

function resolveMessage(messages: Messages, key: string): string {
  const parts = key.split('.');
  let current: unknown = messages;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }

  return typeof current === 'string' ? current : key;
}

function interpolate(template: string, vars?: TranslateVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? `{${name}}`);
}

function applyDocumentLocale(locale: Locale) {
  document.documentElement.lang = locale;
  document.documentElement.dir = isRtl(locale) ? 'rtl' : 'ltr';
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isLocale(stored)) {
      setLocaleState(stored);
      applyDocumentLocale(stored);
    }
  }, []);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    localStorage.setItem(STORAGE_KEY, nextLocale);
    applyDocumentLocale(nextLocale);
  }, []);

  const messages = useMemo(() => getMessages(locale), [locale]);
  const dir = isRtl(locale) ? 'rtl' : 'ltr';

  const t = useCallback(
    (key: string, vars?: TranslateVars) => interpolate(resolveMessage(messages, key), vars),
    [messages],
  );

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
