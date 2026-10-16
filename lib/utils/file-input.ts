export const DEFAULT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;

  const units = ['KB', 'MB', 'GB'] as const;
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const formatted =
    value < 10 && !Number.isInteger(value) ? value.toFixed(1) : String(Math.round(value));
  return `${formatted} ${units[unitIndex]}`;
}

export function formatAcceptTypes(accept: string): string {
  return accept
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      if (part.startsWith('.')) return part.slice(1).toUpperCase();
      if (part.endsWith('/*')) return `${part.slice(0, -2).toUpperCase()} files`;
      const subtype = part.includes('/') ? part.slice(part.indexOf('/') + 1) : part;
      return subtype.replace(/^\./, '').toUpperCase();
    })
    .join(', ');
}
