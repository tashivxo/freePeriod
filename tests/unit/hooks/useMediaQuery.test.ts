/** @jest-environment jsdom */
import { renderHook, act } from '@testing-library/react';

import { useMediaQuery } from '@/hooks/useMediaQuery';

type MockMediaQuery = {
  matches: boolean;
  media: string;
  addEventListener: (event: string, listener: () => void) => void;
  removeEventListener: (event: string, listener: () => void) => void;
  dispatchChange: (next: boolean) => void;
};

function createMockMediaQuery(initialMatches: boolean, media: string): MockMediaQuery {
  const listeners = new Set<() => void>();
  const mq: MockMediaQuery = {
    matches: initialMatches,
    media,
    addEventListener: (_event, listener) => {
      listeners.add(listener);
    },
    removeEventListener: (_event, listener) => {
      listeners.delete(listener);
    },
    dispatchChange: (next) => {
      mq.matches = next;
      listeners.forEach((listener) => listener());
    },
  };
  return mq;
}

describe('useMediaQuery', () => {
  const query = '(max-width: 639px)';
  let mobileQuery: MockMediaQuery;

  beforeEach(() => {
    mobileQuery = createMockMediaQuery(false, query);
    window.matchMedia = jest.fn((q: string) => {
      if (q === query) {
        return mobileQuery as unknown as MediaQueryList;
      }
      return createMockMediaQuery(false, q) as unknown as MediaQueryList;
    });
  });

  it('returns false when the query does not match', () => {
    const { result } = renderHook(() => useMediaQuery(query));
    expect(result.current).toBe(false);
  });

  it('returns true when the query matches', () => {
    mobileQuery.matches = true;
    const { result } = renderHook(() => useMediaQuery(query));
    expect(result.current).toBe(true);
  });

  it('updates when the media query changes', () => {
    const { result } = renderHook(() => useMediaQuery(query));
    expect(result.current).toBe(false);

    act(() => {
      mobileQuery.dispatchChange(true);
    });
    expect(result.current).toBe(true);

    act(() => {
      mobileQuery.dispatchChange(false);
    });
    expect(result.current).toBe(false);
  });

  it('removes the matchMedia listener on unmount', () => {
    const removeSpy = jest.spyOn(mobileQuery, 'removeEventListener');
    const { unmount } = renderHook(() => useMediaQuery(query));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
