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
      // OCR sees rendered pixels, so it remains the fallback for scanned PDFs.
      // Load Tesseract only for that path so image-PDF OCR cannot break module
      // evaluation for text PDFs or other upload types.
      const { extractTextFromImage } = await import('@/lib/ocr/tesseract');
      const ocrText = cleanExtractedText(await extractTextFromImage(buffer));
      return { text: ocrText, type: 'pdf', metadata: { ocr: true } };
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
