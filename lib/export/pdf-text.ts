import { ArabicShaper } from 'arabic-persian-reshaper';
import bidiFactory from 'bidi-js';

const bidi = bidiFactory();

const ARABIC_RE =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

const PRESENTATION_FORM_RE = /[\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function containsArabic(text: string): boolean {
  return ARABIC_RE.test(text);
}

/**
 * Map a few punctuation marks to ASCII so English field values stay the same
 * as the previous WinAnsi fill. Does not strip non-ASCII letters.
 */
export function normalizePdfPunctuation(text: string): string {
  return text
    .replace(/\u2022/g, '-')
    .replace(/\u2014|\u2013/g, '-')
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/\u00a0/g, ' ');
}

export function paragraphBaseIsRtl(text: string): boolean {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) ?? '';
  if (!firstLine || !containsArabic(firstLine)) return false;
  const shaped = ArabicShaper.convertArabic(firstLine);
  const { paragraphs } = bidi.getEmbeddingLevels(shaped);
  return ((paragraphs[0]?.level ?? 0) & 1) === 1;
}

/**
 * Convert Arabic letters to presentation forms and reorder each line for
 * LTR drawing. pdf-lib does not shape or apply the Unicode Bidirectional
 * Algorithm, so this has to happen before glyphs are encoded.
 *
 * Each newline-separated line is processed on its own so an English bullet
 * line is not reordered by a following Arabic line. Leading ASCII list
 * markers on RTL lines may still land on the visual end of the line.
 */
export function shapePdfText(text: string): string {
  return text
    .split(/(\r?\n)/)
    .map((part) => {
      if (part === '\n' || part === '\r\n' || part.length === 0) return part;
      if (!containsArabic(part)) return part;
      const shaped = ArabicShaper.convertArabic(part);
      const levels = bidi.getEmbeddingLevels(shaped);
      return bidi.getReorderedString(shaped, levels);
    })
    .join('');
}

export function usesArabicPresentationForms(text: string): boolean {
  return PRESENTATION_FORM_RE.test(text);
}
