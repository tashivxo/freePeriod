import { TextEncoder, TextDecoder } from 'util';
import {
  convertDocxBufferToPdf,
  PdfConversionUnavailableError,
  resolvePdfConversionMethod,
} from '@/lib/export/docx-to-pdf';

Object.assign(globalThis, { TextEncoder, TextDecoder });

const originalEnv = process.env;
const sampleDocx = Buffer.from('PK\x03\x04fake-docx');

describe('docx-to-pdf', () => {
  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it('returns null when no converter is configured', () => {
    delete process.env.GOTENBERG_URL;
    delete process.env.PDF_CONVERSION_METHOD;
    expect(resolvePdfConversionMethod()).toBeNull();
  });

  it('prefers Gotenberg when GOTENBERG_URL is set', () => {
    process.env.GOTENBERG_URL = 'https://gotenberg.example.com';
    expect(resolvePdfConversionMethod()).toBe('gotenberg');
  });

  it('throws when no converter is configured', async () => {
    delete process.env.GOTENBERG_URL;
    delete process.env.PDF_CONVERSION_METHOD;

    await expect(convertDocxBufferToPdf(sampleDocx)).rejects.toBeInstanceOf(
      PdfConversionUnavailableError,
    );
  });

  it('converts via Gotenberg when configured', async () => {
    process.env.GOTENBERG_URL = 'https://gotenberg.example.com';

    const pdfBody = Buffer.from('%PDF-1.4 test');
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/pdf' },
      arrayBuffer: async () =>
        pdfBody.buffer.slice(pdfBody.byteOffset, pdfBody.byteOffset + pdfBody.byteLength),
      text: async () => '',
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const result = await convertDocxBufferToPdf(sampleDocx);

    expect(result.equals(pdfBody)).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://gotenberg.example.com/forms/libreoffice/convert',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
