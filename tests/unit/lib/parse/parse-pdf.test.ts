/**
 * @jest-environment node
 */

const mockGetText = jest.fn();
const mockDestroy = jest.fn();
const mockRecognize = jest.fn(() => new Promise(() => {}));

jest.mock('pdf-parse', () => ({
  PDFParse: jest.fn().mockImplementation(() => ({
    getText: mockGetText,
    destroy: mockDestroy,
  })),
}));

jest.mock('@/lib/ocr/tesseract', () => ({
  extractTextFromImage: (...args: unknown[]) => mockRecognize(...args),
}));

import { parsePdf } from '@/lib/parse/parse-pdf';

describe('parsePdf low-text PDFs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDestroy.mockResolvedValue(undefined);
  });

  it('returns empty text quickly without calling Tesseract when extracted text is under 20 characters', async () => {
    mockGetText.mockResolvedValue({ text: 'hi', total: 2 });

    const parsed = await parsePdf(Buffer.from('%PDF-1.4 low-text'));

    expect(mockRecognize).not.toHaveBeenCalled();
    expect(parsed).toEqual({
      text: '',
      type: 'pdf',
      metadata: { pages: 2, ocr: false, noTextLayer: true },
    });
    expect(mockDestroy).toHaveBeenCalled();
  }, 2000);
});
