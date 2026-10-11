export type Debounced<T extends (...args: never[]) => void> = T & {
  flush: () => void;
  cancel: () => void;
};

export function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): Debounced<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastArgs: Parameters<T> | undefined;

  const invoke = () => {
    timer = undefined;
    if (lastArgs === undefined) return;
    const args = lastArgs;
    lastArgs = undefined;
    fn(...args);
  };

  const debounced = ((...args: Parameters<T>) => {
    lastArgs = args;
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(invoke, ms);
  }) as Debounced<T>;

  debounced.flush = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
    invoke();
  };

  debounced.cancel = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
    lastArgs = undefined;
  };

  return debounced;
}
