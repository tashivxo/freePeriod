import { renderHook, act } from '@testing-library/react';
import { getMessages, isLocale } from '@/lib/i18n';
import { LocaleProvider, useLocale, useT } from './locale';

describe('i18n helpers', () => {
  it('isLocale returns true for supported locales', () => {
    expect(isLocale('en')).toBe(true);
    expect(isLocale('ar')).toBe(true);
    expect(isLocale('zh-Hans')).toBe(true);
    expect(isLocale('zh')).toBe(false);
    expect(isLocale('zh-Hant')).toBe(false);
    expect(isLocale('xx')).toBe(false);
  });

  it('getMessages returns the zh-Hans dictionary', () => {
    expect(getMessages('zh-Hans').settings.language).toBe('语言');
    expect(getMessages('zh-Hans').settings.languageDescription).toContain('教案');
    expect(getMessages('zh-Hans').landing.tryDarkMode).toBe('试试深色模式');
    expect(getMessages('zh-Hans').landing.tryLightMode).toBe('试试浅色模式');
  });

  it('getMessages returns dictionaries for each locale', () => {
    expect(getMessages('en').settings.title).toBe('Settings');
    expect(getMessages('fr').settings.title).toBe('Paramètres');
  });
});

describe('LocaleProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = 'fp-locale=; Max-Age=0; path=/';
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
  });

  it('defaults locale to en', () => {
    const { result } = renderHook(() => useLocale(), {
      wrapper: LocaleProvider,
    });

    expect(result.current.locale).toBe('en');
    expect(result.current.dir).toBe('ltr');
  });

  it('setLocale updates state, localStorage, and document attributes', () => {
    const { result } = renderHook(() => useLocale(), {
      wrapper: LocaleProvider,
    });

    act(() => {
      result.current.setLocale('ar');
    });

    expect(result.current.locale).toBe('ar');
    expect(result.current.dir).toBe('rtl');
    expect(localStorage.getItem('fp-locale')).toBe('ar');
    expect(document.cookie).toContain('fp-locale=ar');
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('setLocale applies zh-Hans as ltr', () => {
    const { result } = renderHook(() => useLocale(), { wrapper: LocaleProvider });
    act(() => {
      result.current.setLocale('zh-Hans');
    });
    expect(result.current.locale).toBe('zh-Hans');
    expect(result.current.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('zh-Hans');
    expect(document.documentElement.dir).toBe('ltr');
    expect(localStorage.getItem('fp-locale')).toBe('zh-Hans');
  });

  it('keeps initialLocale when document.lang already matches', () => {
    document.documentElement.lang = 'fr';

    const { result } = renderHook(() => useLocale(), {
      wrapper: ({ children }) => (
        <LocaleProvider initialLocale="fr">{children}</LocaleProvider>
      ),
    });

    expect(result.current.locale).toBe('fr');
  });

  it('syncs to document.lang after mount when it differs from initialLocale', () => {
    document.documentElement.lang = 'fr';

    const { result } = renderHook(() => useLocale(), {
      wrapper: ({ children }) => (
        <LocaleProvider initialLocale="en">{children}</LocaleProvider>
      ),
    });

    expect(result.current.locale).toBe('fr');
    expect(localStorage.getItem('fp-locale')).toBe('fr');
    expect(document.cookie).toContain('fp-locale=fr');
  });

  it('defaults to en when initialLocale is omitted and document lang is empty', () => {
    document.documentElement.lang = '';

    const { result } = renderHook(() => useLocale(), {
      wrapper: LocaleProvider,
    });

    expect(result.current.locale).toBe('en');
  });

  it('honors initialLocale from the server cookie when document.lang matches', () => {
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';

    const { result } = renderHook(() => useLocale(), {
      wrapper: ({ children }) => (
        <LocaleProvider initialLocale="ar">{children}</LocaleProvider>
      ),
    });

    expect(result.current.locale).toBe('ar');
    expect(result.current.dir).toBe('rtl');
  });

  it('useT interpolates message variables', () => {
    const { result } = renderHook(() => useT(), {
      wrapper: LocaleProvider,
    });

    expect(result.current('generate.planLanguageHint', { language: 'English' })).toBe(
      'New plans will be written in English',
    );
  });
});
