export const FSI = '\u2068';
export const PDI = '\u2069';

export function stripBidiIsolates(value: string): string {
  return value.replace(/[\u2068\u2069]/g, '');
}

export function visibleName(expected: string) {
  return (accessibleName: string) => stripBidiIsolates(accessibleName) === expected;
}
