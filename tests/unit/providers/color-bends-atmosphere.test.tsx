import type { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLocale } from '@/providers/locale';
import {
  ColorBendsAtmosphereProvider,
  useColorBendsAtmosphere,
} from '@/providers/color-bends-atmosphere';
import { COLOR_BENDS_ATMOSPHERE_STORAGE_KEY } from '@/lib/utils/brand-colors';
import type { Locale } from '@/lib/i18n';

jest.mock('@/providers/locale', () => ({
  useLocale: jest.fn(),
}));

const mockUseLocale = useLocale as jest.MockedFunction<typeof useLocale>;

function mockLocale(locale: Locale) {
  mockUseLocale.mockReturnValue({
    locale,
    setLocale: jest.fn(),
    messages: {} as ReturnType<typeof useLocale>['messages'],
    dir: locale === 'ar' ? 'rtl' : 'ltr',
    t: (key: string) => key,
  });
}

function createWrapper(
  initialCountry: string | null = null,
  initialCurriculum: string | null = null,
) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ColorBendsAtmosphereProvider
        initialCountry={initialCountry}
        initialCurriculum={initialCurriculum}
      >
        {children}
      </ColorBendsAtmosphereProvider>
    );
  };
}

describe('ColorBendsAtmosphereProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    mockLocale('en');
  });

  it('ignores invalid localStorage and keeps the regional default', async () => {
    localStorage.setItem(COLOR_BENDS_ATMOSPHERE_STORAGE_KEY, 'sunset');

    const { result } = renderHook(() => useColorBendsAtmosphere(), {
      wrapper: createWrapper('AE', null),
    });

    await waitFor(() => {
      expect(result.current.atmosphere).toBeNull();
      expect(result.current.resolvedAtmosphere).toBe('brand');
    });
  });

  it('applies a stored brand override after mount', async () => {
    localStorage.setItem(COLOR_BENDS_ATMOSPHERE_STORAGE_KEY, 'brand');

    const { result } = renderHook(() => useColorBendsAtmosphere(), {
      wrapper: createWrapper(null, null),
    });

    await waitFor(() => {
      expect(result.current.atmosphere).toBe('brand');
    });
    expect(result.current.resolvedAtmosphere).toBe('brand');
  });

  it('applies a stored rainbow override after mount', async () => {
    localStorage.setItem(COLOR_BENDS_ATMOSPHERE_STORAGE_KEY, 'rainbow');

    const { result } = renderHook(() => useColorBendsAtmosphere(), {
      wrapper: createWrapper('AE', 'UAE MOE'),
    });

    await waitFor(() => {
      expect(result.current.atmosphere).toBe('rainbow');
    });
    expect(result.current.resolvedAtmosphere).toBe('rainbow');
  });

  it('setAtmosphere writes the sticky override to localStorage', () => {
    const { result } = renderHook(() => useColorBendsAtmosphere(), {
      wrapper: createWrapper(null, null),
    });

    act(() => {
      result.current.setAtmosphere('brand');
    });

    expect(result.current.atmosphere).toBe('brand');
    expect(result.current.resolvedAtmosphere).toBe('brand');
    expect(localStorage.getItem(COLOR_BENDS_ATMOSPHERE_STORAGE_KEY)).toBe('brand');
  });

  it('setProfileSignals changes resolved atmosphere when the override is null', () => {
    const { result } = renderHook(() => useColorBendsAtmosphere(), {
      wrapper: createWrapper(null, null),
    });

    expect(result.current.atmosphere).toBeNull();
    expect(result.current.resolvedAtmosphere).toBe('rainbow');

    act(() => {
      result.current.setProfileSignals({ country: 'AE', curriculum: null });
    });

    expect(result.current.atmosphere).toBeNull();
    expect(result.current.resolvedAtmosphere).toBe('brand');
  });

  it('setProfileSignals does not change resolved atmosphere when an override is set', () => {
    const { result } = renderHook(() => useColorBendsAtmosphere(), {
      wrapper: createWrapper(null, null),
    });

    act(() => {
      result.current.setAtmosphere('rainbow');
    });

    act(() => {
      result.current.setProfileSignals({ country: 'AE', curriculum: 'UAE MOE' });
    });

    expect(result.current.atmosphere).toBe('rainbow');
    expect(result.current.resolvedAtmosphere).toBe('rainbow');
  });

  it('does not flip the default to brand when locale is Arabic', () => {
    mockLocale('ar');

    const { result } = renderHook(() => useColorBendsAtmosphere(), {
      wrapper: createWrapper('GB', 'GCSE'),
    });

    expect(result.current.atmosphere).toBeNull();
    expect(result.current.resolvedAtmosphere).toBe('rainbow');
  });

  it('keeps a Multicolour preference after the locale changes to Arabic', () => {
    mockLocale('en');
    const { result, rerender } = renderHook(() => useColorBendsAtmosphere(), {
      wrapper: createWrapper('GB', 'GCSE'),
    });

    act(() => {
      result.current.setAtmosphere('rainbow');
    });
    expect(result.current.resolvedAtmosphere).toBe('rainbow');

    mockLocale('ar');
    rerender();

    expect(result.current.atmosphere).toBe('rainbow');
    expect(result.current.resolvedAtmosphere).toBe('rainbow');
  });
});
