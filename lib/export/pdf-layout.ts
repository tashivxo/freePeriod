import type { PDFFont } from 'pdf-lib';
import {
  firstStrongIsRtl as firstStrongFromText,
  reorderPdfLine,
  shapeArabicLogical,
} from '@/lib/export/pdf-text';

export const PDF_BULLET = '\u2022';
export const PDF_LINE_HEIGHT_RATIO = 1.3;
export const PDF_SINGLE_FONT_SIZE = 11;
export const PDF_MULTILINE_FONT_SIZE = 9;
export const PDF_MIN_FONT_SIZE = 4;

export type PdfFieldTextRun = {
  kind: 'bullet' | 'text';
  text: string;
  x: number;
  y: number;
  width: number;
  rtl: boolean;
};

export type PdfFieldBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PdfFieldType = 'single' | 'multiline';

const BULLET_PREFIX_RE = /^(?:[\u2022\-\u2013\u2014])[ \t]+/;

export function firstStrongIsRtl(text: string): boolean {
  return firstStrongFromText(text.replace(BULLET_PREFIX_RE, ''));
}

function widthOf(font: PDFFont, text: string, size: number): number {
  if (!text) return 0;
  return font.widthOfTextAtSize(text, size);
}

function lastWhitespaceIndex(line: string): number | undefined {
  for (let idx = line.length - 1; idx >= 0; idx -= 1) {
    if (/\s/.test(line[idx] ?? '')) return idx;
  }
  return undefined;
}

/**
 * Wrap `input` in logical (memory) order. Does not bidi-reorder: callers
 * reorder each returned line on its own after wrapping.
 */
function wrapLogical(
  input: string,
  maxWidth: number,
  font: PDFFont,
  fontSize: number,
): string[] {
  if (!input) return [''];
  const lines: string[] = [];
  let remaining: string | undefined = input;
  while (remaining !== undefined) {
    if (widthOf(font, remaining, fontSize) <= maxWidth) {
      lines.push(remaining);
      break;
    }
    let cut = remaining.length;
    let found = false;
    while (cut > 0) {
      const candidate = remaining.slice(0, cut);
      if (widthOf(font, candidate, fontSize) <= maxWidth) {
        const spaceInCandidate = lastWhitespaceIndex(candidate);
        if (spaceInCandidate !== undefined && spaceInCandidate > 0) {
          lines.push(remaining.slice(0, spaceInCandidate).replace(/\s+$/, ''));
          remaining = remaining.slice(spaceInCandidate).replace(/^\s+/, '') || undefined;
        } else {
          lines.push(candidate);
          remaining = remaining.slice(cut).replace(/^\s+/, '') || undefined;
        }
        found = true;
        break;
      }
      const prevSpace = lastWhitespaceIndex(candidate);
      cut = prevSpace !== undefined && prevSpace > 0 ? prevSpace : cut - 1;
    }
    if (!found) {
      lines.push(remaining);
      break;
    }
  }
  return lines.length > 0 ? lines : [''];
}

function splitBullet(line: string): { hasBullet: boolean; body: string } {
  const match = line.match(/^(?:[\u2022\-\u2013\u2014])[ \t]+(.*)$/);
  if (!match) return { hasBullet: false, body: line };
  return { hasBullet: true, body: match[1] ?? '' };
}

function linesFitBox(runs: PdfFieldTextRun[], bounds: PdfFieldBounds): boolean {
  if (runs.length === 0) return true;
  const minY = Math.min(...runs.map((run) => run.y));
  return minY >= bounds.y - 0.05;
}

/**
 * Shape Arabic glyphs, wrap in logical order, then bidi-reorder each visual
 * line on its own. List markers are drawn as a separate U+2022 run so bidi
 * cannot move them.
 */
export function layoutPdfFieldText(
  text: string,
  font: PDFFont,
  fontSize: number,
  bounds: PdfFieldBounds,
): PdfFieldTextRun[] {
  const lineHeight = fontSize * PDF_LINE_HEIGHT_RATIO;
  const bulletWidth = widthOf(font, PDF_BULLET, fontSize);
  const gap = Math.max(widthOf(font, ' ', fontSize), 2);
  const indent = bulletWidth + gap;
  const runs: PdfFieldTextRun[] = [];
  let y = bounds.y + bounds.height - lineHeight;

  for (const rawLine of text.split(/\r?\n/)) {
    if (rawLine.length === 0) {
      y -= lineHeight;
      continue;
    }

    const rtl = firstStrongIsRtl(rawLine);
    const { hasBullet, body } = splitBullet(rawLine);
    const shaped = shapeArabicLogical(body);
    const textMaxWidth = Math.max(1, bounds.width - (hasBullet ? indent : 0));
    const logicalLines = wrapLogical(shaped, textMaxWidth, font, fontSize);

    const textRight = hasBullet
      ? bounds.x + bounds.width - indent
      : bounds.x + bounds.width;
    const textLeft = hasBullet ? bounds.x + indent : bounds.x;

    logicalLines.forEach((logicalLine, index) => {
      const visual = reorderPdfLine(logicalLine, rtl);
      const textWidth = widthOf(font, visual, fontSize);
      const textX = rtl ? textRight - textWidth : textLeft;

      if (hasBullet && index === 0) {
        const bulletX = rtl ? bounds.x + bounds.width - bulletWidth : bounds.x;
        runs.push({
          kind: 'bullet',
          text: PDF_BULLET,
          x: bulletX,
          y,
          width: bulletWidth,
          rtl,
        });
      }

      if (visual) {
        runs.push({
          kind: 'text',
          text: visual,
          x: textX,
          y,
          width: textWidth,
          rtl,
        });
      }

      y -= lineHeight;
    });
  }

  return runs;
}

/**
 * One fixed size per field type. Shrink only when the laid-out lines would
 * overflow the box. Never drop or clamp the last line.
 */
export function fitPdfFieldFontSize(
  text: string,
  font: PDFFont,
  bounds: PdfFieldBounds,
  fieldType: PdfFieldType,
): number {
  const preferred = fieldType === 'single' ? PDF_SINGLE_FONT_SIZE : PDF_MULTILINE_FONT_SIZE;
  if (!text) return preferred;
  for (let size = preferred; size >= PDF_MIN_FONT_SIZE; size -= 1) {
    const runs = layoutPdfFieldText(text, font, size, bounds);
    if (linesFitBox(runs, bounds)) return size;
  }
  return PDF_MIN_FONT_SIZE;
}
