import { renderHook, act, waitFor } from '@testing-library/react';
import { ZenModeProvider, useZenMode } from './zen-mode';

describe('ZenModeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults zenMode to false', () => {
    const { result } = renderHook(() => useZenMode(), {
      wrapper: ZenModeProvider,
    });

    expect(result.current.zenMode).toBe(false);
  });

  it('setZenMode(true) updates state and writes fp-zen-mode to localStorage', () => {
    const { result } = renderHook(() => useZenMode(), {
      wrapper: ZenModeProvider,
    });

    act(() => {
      result.current.setZenMode(true);
    });

    expect(result.current.zenMode).toBe(true);
    expect(localStorage.getItem('fp-zen-mode')).toBe('true');
  });

  it('hydrates zenMode from localStorage on mount', async () => {
    localStorage.setItem('fp-zen-mode', 'true');

    const { result } = renderHook(() => useZenMode(), {
      wrapper: ZenModeProvider,
    });

    await waitFor(() => {
      expect(result.current.zenMode).toBe(true);
    });
  });
});
