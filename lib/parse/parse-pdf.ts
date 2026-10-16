import './ensure-pdfjs-dom-polyfill';
import { PDFParse } from 'pdf-parse';
import { cleanExtractedText } from './filter-visible-text';
import type { ParsedContent } from './types';

export async function parsePdf(buffer: Buffer): Promise<ParsedContent> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    const text = cleanExtractedText(result.text);

    if (text.length < 20) {
      // Tesseract cannot read PDF bytes and hangs on Vercel. Return empty text
      // so the parse-document route can 422 with the existing no-text copy.
      return {
        text: '',
        type: 'pdf',
        metadata: { pages: result.total, ocr: false, noTextLayer: true },
      };
    }

    // pdf-parse v2 exposes page text but not text-item font/color/coordinates
    // through getText(). Tiny, white, and off-page PDF text therefore cannot be
    // safely filtered without adding a separate PDF rendering engine. We still
    // remove non-rendering Unicode controls from the extracted stream.
    return {
      text,
      type: 'pdf',
      metadata: { pages: result.total, pdfVisibilityMetadataUnavailable: true },
    };
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}
