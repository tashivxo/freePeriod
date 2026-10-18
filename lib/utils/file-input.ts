import { isolateBidi } from '@/lib/i18n/format';
import { isLocale, isRtl } from '@/lib/i18n/locales';

export const DEFAULT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function formatSizeLabel(value: string, unit: string, locale: string): string {
  const text = `${value} ${unit}`;
  return isLocale(locale) && isRtl(locale) ? isolateBidi(text) : text;
}

export function formatFileSize(bytes: number, locale = 'en'): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return formatSizeLabel(new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(0), 'B', locale);
  }
  if (bytes < 1024) {
    return formatSizeLabel(
      new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(bytes),
      'B',
      locale,
    );
  }

  const units = ['KB', 'MB', 'GB'] as const;
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const useTenth = value < 10 && !Number.isInteger(value);
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: useTenth ? 1 : 0,
    minimumFractionDigits: useTenth ? 1 : 0,
  }).format(useTenth ? Number(value.toFixed(1)) : Math.round(value));
  return formatSizeLabel(formatted, units[unitIndex], locale);
}

export function formatAcceptTypes(accept: string, filesSuffix = 'files'): string {
  return accept
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      if (part.startsWith('.')) return part.slice(1).toUpperCase();
      if (part.endsWith('/*')) return `${part.slice(0, -2).toUpperCase()} ${filesSuffix}`;
      const subtype = part.includes('/') ? part.slice(part.indexOf('/') + 1) : part;
      return subtype.replace(/^\./, '').toUpperCase();
    })
    .join(', ');
}
