import { renderHook, act, waitFor } from '@testing-library/react';
import { getMessages, isLocale } from '@/lib/i18n';
import { LocaleProvider, useLocale, useT } from '@/providers/locale';

const mockGetUser = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
    },
    from: jest.fn(() => ({
      update: (...args: unknown[]) => {
        mockUpdate(...args);
        return { eq: (...eqArgs: unknown[]) => mockEq(...eqArgs) };
      },
    })),
  })),
}));

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
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockEq.mockResolvedValue({ error: null });
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

  it('persists preferred_locale for a signed-in user after setLocale', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const { result } = renderHook(() => useLocale(), {
      wrapper: LocaleProvider,
    });

    await act(async () => {
      await result.current.setLocale('ar');
    });

    expect(mockUpdate).toHaveBeenCalledWith({ preferred_locale: 'ar' });
    expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
  });

  it('applies RTL and Arabic strings immediately while preferred_locale save is in flight', async () => {
    let resolveEq: ((value: { error: null }) => void) | undefined;
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    mockEq.mockReturnValue(
      new Promise<{ error: null }>((resolve) => {
        resolveEq = resolve;
      }),
    );

    const { result } = renderHook(() => useLocale(), {
      wrapper: LocaleProvider,
    });

    act(() => {
      void result.current.setLocale('ar');
    });

    expect(result.current.locale).toBe('ar');
    expect(result.current.dir).toBe('rtl');
    expect(result.current.t('settings.language')).toBe('اللغة');
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(localStorage.getItem('fp-locale')).toBe('ar');

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({ preferred_locale: 'ar' });
    });

    expect(result.current.locale).toBe('ar');
    expect(result.current.dir).toBe('rtl');
    resolveEq?.({ error: null });
  });

  it('rejects when preferred_locale cannot be saved so callers can surface the error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    mockEq.mockResolvedValue({ error: { message: 'permission denied' } });

    const { result } = renderHook(() => useLocale(), {
      wrapper: LocaleProvider,
    });

    let caught: unknown;
    await act(async () => {
      try {
        await result.current.setLocale('fr');
      } catch (err) {
        caught = err;
      }
    });

    expect(caught).toMatchObject({ message: 'permission denied' });
  });

  it('applies locale locally then rejects a network TypeError so callers can surface it', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    mockEq.mockRejectedValue(new TypeError('Failed to fetch'));

    const { result } = renderHook(() => useLocale(), {
      wrapper: LocaleProvider,
    });

    let caught: unknown;
    await act(async () => {
      try {
        await result.current.setLocale('ar');
      } catch (err) {
        caught = err;
      }
    });

    expect(result.current.locale).toBe('ar');
    expect(result.current.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(caught).toBeInstanceOf(TypeError);
    expect((caught as TypeError).message).toMatch(/failed to fetch/i);
  });
});
