import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { PDFDocument, PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

/**
 * Merged, subset Noto Sans Arabic + Noto Sans (Latin). SIL OFL 1.1.
 * About 106 KB on disk; pdf-lib subsets further to glyphs used in the PDF.
 */
export const PDF_UNICODE_FONT_PATH = path.join(
  process.cwd(),
  'assets/fonts/NotoSansArabicLatin-Regular.ttf',
);

let cachedFontBytes: Uint8Array | undefined;

export function loadPdfUnicodeFontBytes(): Uint8Array {
  cachedFontBytes ??= new Uint8Array(readFileSync(PDF_UNICODE_FONT_PATH));
  return cachedFontBytes;
}

export async function embedPdfUnicodeFont(pdfDoc: PDFDocument): Promise<PDFFont> {
  pdfDoc.registerFontkit(fontkit);
  return pdfDoc.embedFont(loadPdfUnicodeFontBytes(), { subset: true });
}
