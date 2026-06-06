import { generateDocx } from '@/lib/export/docx';
import type { LessonPlan } from '@/types';

export type PdfConversionMethod = 'gotenberg' | 'libreoffice';

export class PdfConversionUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PdfConversionUnavailableError';
  }
}

export function resolvePdfConversionMethod(): PdfConversionMethod | null {
  if (process.env.GOTENBERG_URL?.trim()) {
    return 'gotenberg';
  }

  if (process.env.PDF_CONVERSION_METHOD === 'libreoffice') {
    return 'libreoffice';
  }

  return null;
}

async function convertViaGotenberg(docxBuffer: Buffer): Promise<Buffer> {
  const baseUrl = process.env.GOTENBERG_URL?.trim().replace(/\/$/, '');
  if (!baseUrl) {
    throw new PdfConversionUnavailableError('GOTENBERG_URL is not configured.');
  }

  const formData = new FormData();
  formData.append('files', new Blob([Uint8Array.from(docxBuffer)]), 'lesson.docx');

  const response = await fetch(`${baseUrl}/forms/libreoffice/convert`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      `Gotenberg conversion failed (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ''}`,
    );
  }

  const contentType = response.headers.get('content-type') ?? '';
  const pdfBytes = Buffer.from(await response.arrayBuffer());

  if (contentType.includes('application/zip')) {
    throw new Error('Gotenberg returned a ZIP archive; expected a single PDF.');
  }

  if (pdfBytes.subarray(0, 4).toString() !== '%PDF') {
    throw new Error('Gotenberg response was not a valid PDF.');
  }

  return pdfBytes;
}

async function convertViaLibreOffice(docxBuffer: Buffer): Promise<Buffer> {
  const { promisify } = await import('node:util');
  const libre = await import('libreoffice-convert');
  const convertAsync = promisify(libre.default.convert);

  try {
    const pdfBuffer = (await convertAsync(docxBuffer, '.pdf', undefined)) as Buffer;
    return pdfBuffer;
  } catch {
    throw new PdfConversionUnavailableError(
      'LibreOffice conversion failed. Install LibreOffice locally or set GOTENBERG_URL for serverless deployments.',
    );
  }
}

export async function convertDocxBufferToPdf(docxBuffer: Buffer): Promise<Buffer> {
  const method = resolvePdfConversionMethod();

  if (method === 'gotenberg') {
    return convertViaGotenberg(docxBuffer);
  }

  if (method === 'libreoffice') {
    return convertViaLibreOffice(docxBuffer);
  }

  throw new PdfConversionUnavailableError(
    'PDF export requires GOTENBERG_URL (recommended for Vercel) or PDF_CONVERSION_METHOD=libreoffice with LibreOffice installed locally.',
  );
}

export async function generatePdfFromLesson(lesson: LessonPlan): Promise<Buffer> {
  const docxBuffer = await generateDocx(lesson);
  return convertDocxBufferToPdf(docxBuffer);
}
