import type { LessonSection } from '@/types';

export type AdaptiveBand = 'towards' | 'at' | 'depth';

const BAND_HEADINGS: Record<AdaptiveBand, string> = {
  towards: 'Working Towards Mastery',
  at: 'Working At Mastery',
  depth: 'Mastery with Greater Depth',
};

/** The cross-reference one section writes to send the reader to another band. */
export function adaptivePointer(band: AdaptiveBand): string {
  return `See Adaptive Teaching: ${BAND_HEADINGS[band]}.`;
}

function normalizeLine(line: string): string {
  return line
    .replace(/[*_`]/g, '')
    .replace(/^[\s•\-]+/, '')
    .replace(/\s+/g, ' ')
    .replace(/[.\s]+$/, '')
    .trim()
    .toLowerCase();
}

/**
 * True when `line` only tells the reader to go to the band it is already in, for
 * example "See Adaptive Teaching: Working At Mastery." inside Working At Mastery.
 * A pointer to a different band, or a generic "See Adaptive Teaching.", is a real
 * cross-reference and is not matched.
 */
export function isAdaptiveSelfPointer(line: string, band: AdaptiveBand): boolean {
  return normalizeLine(line) === normalizeLine(adaptivePointer(band));
}

/** Drops self-pointer lines, including ones inside a multi-line item. */
export function withoutAdaptiveSelfPointers(items: string[], band: AdaptiveBand): string[] {
  const kept: string[] = [];
  for (const item of items) {
    if (!item.includes('\n')) {
      if (!isAdaptiveSelfPointer(item, band)) kept.push(item);
      continue;
    }
    const lines = item.split('\n').filter((line) => !isAdaptiveSelfPointer(line, band));
    const rest = lines.join('\n');
    if (rest.trim()) kept.push(rest);
  }
  return kept;
}

function cleanBand(items: string[], band: AdaptiveBand): string[] {
  if (!Array.isArray(items)) return items;
  const cleaned = withoutAdaptiveSelfPointers(items, band);
  const unchanged = cleaned.length === items.length && cleaned.every((item, index) => item === items[index]);
  return unchanged ? items : cleaned;
}

/**
 * Lesson-level guard shared by the in-app view, DOCX, PDF, and template fill.
 * successCriteria is what the exports show as Working At Mastery; support and
 * extension feed Working Towards Mastery and Mastery with Greater Depth.
 * templateSlots are left alone: a Practice cell may legitimately point at Adaptive Teaching.
 * Returns the same object when nothing needs removing.
 */
export function stripAdaptiveSelfPointers<T extends LessonSection>(content: T): T {
  const successCriteria = cleanBand(content.successCriteria, 'at');
  const differentiation = content.differentiation;
  const support = differentiation ? cleanBand(differentiation.support, 'towards') : undefined;
  const extension = differentiation ? cleanBand(differentiation.extension, 'depth') : undefined;

  const differentiationChanged =
    differentiation !== undefined &&
    (support !== differentiation.support || extension !== differentiation.extension);
  if (successCriteria === content.successCriteria && !differentiationChanged) return content;

  return {
    ...content,
    successCriteria,
    ...(differentiationChanged && differentiation
      ? { differentiation: { ...differentiation, support: support!, extension: extension! } }
      : {}),
  };
}
