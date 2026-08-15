import { renderHook, act, waitFor } from '@testing-library/react';
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
  });

  it('getMessages returns dictionaries for each locale', () => {
    expect(getMessages('en').settings.title).toBe('Settings');
    expect(getMessages('fr').settings.title).toBe('Paramètres');
  });
});

describe('LocaleProvider', () => {
  beforeEach(() => {
    localStorage.clear();
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

  it('hydrates locale from localStorage on mount', async () => {
    localStorage.setItem('fp-locale', 'es');

    const { result } = renderHook(() => useLocale(), {
      wrapper: LocaleProvider,
    });

    await waitFor(() => {
      expect(result.current.locale).toBe('es');
    });
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
