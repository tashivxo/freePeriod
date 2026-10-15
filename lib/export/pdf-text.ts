import { ArabicShaper } from 'arabic-persian-reshaper';
import bidiFactory from 'bidi-js';
import { PDFHexString, type PDFFont } from 'pdf-lib';

const bidi = bidiFactory();

const ARABIC_RE =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

const PRESENTATION_FORM_RE = /[\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function containsArabic(text: string): boolean {
  return ARABIC_RE.test(text);
}

/**
 * Map a few punctuation marks to ASCII so English field values stay the same
 * as the previous WinAnsi fill. Does not strip non-ASCII letters. Keeps U+2022
 * list bullets, and turns a leading "- " marker into U+2022 so lists are not
 * drawn as "- - ".
 */
export function normalizePdfPunctuation(text: string): string {
  return text
    .replace(/(^|\n)(?:[\u2022\-\u2013\u2014][ \t]+)+/g, '$1\u2022 ')
    .replace(/\u2014|\u2013/g, '-')
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/\u00a0/g, ' ');
}

/**
 * True when the first strong bidirectional character is Arabic or R.
 * Neutrals, digits, and list markers are skipped.
 */
export function firstStrongIsRtl(text: string): boolean {
  for (const char of text) {
    const type = bidi.getBidiCharTypeName(char);
    if (type === 'L') return false;
    if (type === 'R' || type === 'AL') return true;
  }
  return false;
}

export function paragraphBaseIsRtl(text: string): boolean {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) ?? '';
  if (!firstLine) return false;
  return firstStrongIsRtl(firstLine);
}

/** Presentation-form substitution only. Logical order is unchanged. */
export function shapeArabicLogical(text: string): string {
  if (!text || !containsArabic(text)) return text;
  return ArabicShaper.convertArabic(text);
}

/**
 * UAX#9 reorder of one already-wrapped line. `rtl` forces the paragraph
 * direction so wrapped continuations keep the item's first-strong direction.
 */
export function reorderPdfLine(text: string, rtl: boolean): string {
  if (!text) return text;
  if (!containsArabic(text) && !rtl) return text;
  const levels = bidi.getEmbeddingLevels(text, rtl ? 'rtl' : 'ltr');
  return bidi.getReorderedString(text, levels);
}

/**
 * Convert Arabic letters to presentation forms and reorder each newline
 * separated line for LTR drawing. Wrapping must happen on the logical
 * shaped string first; use `layoutPdfFieldText` for field appearances.
 */
export function shapePdfText(text: string): string {
  return text
    .split(/(\r?\n)/)
    .map((part) => {
      if (part === '\n' || part === '\r\n' || part.length === 0) return part;
      const rtl = firstStrongIsRtl(part);
      return reorderPdfLine(shapeArabicLogical(part), rtl);
    })
    .join('');
}

export function usesArabicPresentationForms(text: string): boolean {
  return PRESENTATION_FORM_RE.test(text);
}

/**
 * Encode already-visual text in left-to-right show order. pdf-lib's
 * encodeText uses fontkit.layout on the whole string, which applies a second
 * bidi pass and flips Arabic, digits, and Latin. Encoding one character at a
 * time keeps the visual order from reshape-then-bidi-once.
 */
export function encodePdfDrawText(font: PDFFont, text: string): PDFHexString {
  if (!text) return font.encodeText('');
  let hex = '';
  for (const char of text) {
    hex += font.encodeText(char).asString();
  }
  return PDFHexString.of(hex);
}
