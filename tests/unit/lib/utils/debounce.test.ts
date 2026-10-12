import { debounce } from '@/lib/utils/debounce';

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('exposes flush that runs the pending call immediately', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 1_000);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    const flush = (debounced as { flush?: () => void }).flush;
    expect(typeof flush).toBe('function');
    flush?.();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('flush is a no-op when nothing is pending', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 1_000);

    const flush = (debounced as { flush?: () => void }).flush;
    expect(typeof flush).toBe('function');
    flush?.();
    expect(fn).not.toHaveBeenCalled();
  });
});
