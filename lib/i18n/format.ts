const FSI = '\u2068';
const PDI = '\u2069';

export type TranslateFn = (key: string, vars?: Record<string, string>) => string;

/** Wrap a value in a first-strong isolate so surrounding RTL cannot reorder it. */
export function isolateBidi(value: string): string {
  return `${FSI}${value}${PDI}`;
}

export function interpolate(template: string, vars?: Record<string, string>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? `{${name}}`);
}

export function formatDurationMinutes(minutes: number, t: TranslateFn): string {
  return isolateBidi(t('generate.durationMinutes', { minutes: String(minutes) }));
}

export function formatDurationShort(minutes: number, t: TranslateFn): string {
  return isolateBidi(t('generate.durationShort', { minutes: String(minutes) }));
}
