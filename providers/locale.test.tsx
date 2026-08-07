import { renderHook, act, waitFor } from '@testing-library/react';
import { getMessages, isLocale } from '@/lib/i18n';
import { LocaleProvider, useLocale, useT } from './locale';

describe('i18n helpers', () => {
  it('isLocale returns true for supported locales', () => {
    expect(isLocale('en')).toBe(true);
    expect(isLocale('ar')).toBe(true);
    expect(isLocale('xx')).toBe(false);
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
