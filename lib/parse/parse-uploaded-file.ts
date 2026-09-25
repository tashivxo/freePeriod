import type { ParsedContent } from './types';

export class UnsupportedFileTypeError extends Error {
  readonly ext: string;

  constructor(ext: string) {
    super(`Unsupported file type: ${ext || 'unknown'}`);
    this.name = 'UnsupportedFileTypeError';
    this.ext = ext;
  }
}

export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? '';
}

/**
 * Parse an uploaded buffer by extension. PDF/OCR deps are loaded only when
 * needed so a pdfjs browser-API crash cannot take down DOCX/XLSX.
 */
export async function parseUploadedFile(
  buffer: Buffer,
  fileName: string,
): Promise<ParsedContent> {
  const ext = getFileExtension(fileName);

  switch (ext) {
    case 'docx': {
      const { parseDocx } = await import('./parse-docx');
      return parseDocx(buffer);
    }
    case 'pdf': {
      const { parsePdf } = await import('./parse-pdf');
      return parsePdf(buffer);
    }
    case 'xlsx': {
      const { parseXlsx } = await import('./parse-xlsx');
      return parseXlsx(buffer);
    }
    case 'jpg':
    case 'jpeg':
    case 'png': {
      const { extractTextFromImage } = await import('@/lib/ocr/tesseract');
      const text = await extractTextFromImage(buffer);
      return { text, type: 'image', metadata: { ocr: true } };
    }
    default:
      throw new UnsupportedFileTypeError(ext);
  }
}

export function parseFailureMessage(error: unknown): string {
  if (error instanceof UnsupportedFileTypeError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    if (/DOMMatrix is not defined/i.test(error.message)) {
      return 'Failed to read this PDF on the server. Please try again, or upload a DOCX or XLSX copy.';
    }
    if (error.message.length <= 240 && !error.message.includes('\n')) {
      return error.message;
    }
  }

  return 'Failed to parse document';
}
