import { formatDurationMinutes, formatDurationShort } from '@/lib/i18n/format';

const FSI = '\u2068';
const PDI = '\u2069';

describe('formatDurationMinutes', () => {
  it('wraps the number and unit in a first-strong isolate so RTL cannot reverse min 60', () => {
    const t = (key: string, vars?: Record<string, string>) => {
      if (key === 'generate.durationMinutes') return `${vars?.minutes} min`;
      if (key === 'generate.durationShort') return `${vars?.minutes}m`;
      return key;
    };

    expect(formatDurationMinutes(60, t)).toBe(`${FSI}60 min${PDI}`);
    expect(formatDurationShort(60, t)).toBe(`${FSI}60m${PDI}`);
    expect(formatDurationMinutes(60, t).startsWith('min')).toBe(false);
  });
});
