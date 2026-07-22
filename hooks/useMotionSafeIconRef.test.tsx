/** @jest-environment jsdom */
import { renderHook, act } from '@testing-library/react';

import { useMotionSafeIconRef } from './useMotionSafeIconRef';

const zenModeState = { zenMode: false };

jest.mock('@/providers/zen-mode', () => ({
  useZenMode: () => zenModeState,
}));

type MockMediaQuery = {
  matches: boolean;
  media: string;
  addEventListener: (event: string, listener: () => void) => void;
  removeEventListener: (event: string, listener: () => void) => void;
  dispatchChange: (next: boolean) => void;
};

function createMockMediaQuery(initialMatches: boolean): MockMediaQuery {
  const listeners = new Set<() => void>();
  const mq: MockMediaQuery = {
    matches: initialMatches,
    media: '(prefers-reduced-motion: reduce)',
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

describe('useMotionSafeIconRef', () => {
  let reducedMotionQuery: MockMediaQuery;

  beforeEach(() => {
    zenModeState.zenMode = false;
    reducedMotionQuery = createMockMediaQuery(false);
    window.matchMedia = jest.fn((query: string) => {
      if (query === '(prefers-reduced-motion: reduce)') {
        return reducedMotionQuery as unknown as MediaQueryList;
      }
      return createMockMediaQuery(false) as unknown as MediaQueryList;
    });
  });

  it('returns animationDisabled false and a ref when reduced motion is off', () => {
    const { result } = renderHook(() => useMotionSafeIconRef());

    expect(result.current.animationDisabled).toBe(false);
    expect(result.current.ref).toBeDefined();
    expect(result.current.ref.current).toBeNull();
  });

  it('returns animationDisabled true when prefers-reduced-motion is on', () => {
    reducedMotionQuery.matches = true;
    const { result } = renderHook(() => useMotionSafeIconRef());

    expect(result.current.animationDisabled).toBe(true);
    expect(result.current.ref).toBeDefined();
  });

  it('returns animationDisabled true when zen mode is on', () => {
    zenModeState.zenMode = true;
    const { result } = renderHook(() => useMotionSafeIconRef());

    expect(result.current.animationDisabled).toBe(true);
  });

  it('updates animationDisabled when reduced motion preference changes', () => {
    const { result } = renderHook(() => useMotionSafeIconRef());

    expect(result.current.animationDisabled).toBe(false);

    act(() => {
      reducedMotionQuery.dispatchChange(true);
    });

    expect(result.current.animationDisabled).toBe(true);

    act(() => {
      reducedMotionQuery.dispatchChange(false);
    });

    expect(result.current.animationDisabled).toBe(false);
  });

  it('removes matchMedia listener on unmount', () => {
    const removeSpy = jest.spyOn(reducedMotionQuery, 'removeEventListener');
    const { unmount } = renderHook(() => useMotionSafeIconRef());

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
