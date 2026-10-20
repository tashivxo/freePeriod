import { getMessages, type Locale } from '@/lib/i18n';
import type { Plan } from '@/types';

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

function resolveMessage(messages: unknown, key: string): string {
  const parts = key.split('.');
  let current: unknown = messages;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  return typeof current === 'string' ? current : key;
}

export function createT(locale: Locale): TranslateFn {
  const messages = getMessages(locale);
  return (key, vars) => interpolate(resolveMessage(messages, key), vars);
}

export function formatDurationMinutes(minutes: number, t: TranslateFn): string {
  return isolateBidi(t('generate.durationMinutes', { minutes: String(minutes) }));
}

export function formatDurationShort(minutes: number, t: TranslateFn): string {
  return isolateBidi(t('generate.durationShort', { minutes: String(minutes) }));
}

export function formatGenerationUsage(input: {
  plan: Plan;
  generationCount: number;
  generationLimit: number | null;
  locale: Locale;
}): string {
  const used = isolateBidi(String(input.generationCount));
  const settings = getMessages(input.locale).settings;
  if (input.generationLimit === null) {
    return interpolate(settings.usageUnlimited, { used });
  }
  return interpolate(settings.usageThisPeriod, {
    used,
    limit: isolateBidi(String(input.generationLimit)),
  });
}
