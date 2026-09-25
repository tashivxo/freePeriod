/**
 * @jest-environment node
 */
import { ensurePdfJsDomPolyfill } from '@/lib/parse/ensure-pdfjs-dom-polyfill';
import { parsePdf } from '@/lib/parse/parse-pdf';
import { parseUploadedFile } from '@/lib/parse/parse-uploaded-file';

jest.mock('@/lib/ocr/tesseract', () => ({
  extractTextFromImage: jest.fn(async () => {
    throw new Error('OCR should not run for text PDFs');
  }),
}));

function buildMinimalTextPdf(text: string): Buffer {
  const escaped = text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const stream = `BT /F1 18 Tf 72 720 Td (${escaped}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let body = '%PDF-1.4\n';
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(body));
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }

  const xrefPos = Buffer.byteLength(body);
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i += 1) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  body += `${xref}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;
  return Buffer.from(body);
}

type DomMatrixCtor = {
  new (init?: string | ArrayLike<number>): {
    isIdentity: boolean;
    scaleSelf: (scaleX?: number, scaleY?: number) => {
      translateSelf: (tx?: number, ty?: number) => unknown;
    };
  };
};

function getDomMatrix(): DomMatrixCtor | undefined {
  return (globalThis as { DOMMatrix?: DomMatrixCtor }).DOMMatrix;
}

function clearDomMatrix() {
  Reflect.deleteProperty(globalThis, 'DOMMatrix');
}

describe('pdfjs Node polyfill', () => {
  it('defines DOMMatrix so pdfjs can evaluate without a browser or canvas', () => {
    clearDomMatrix();
    expect(getDomMatrix()).toBeUndefined();

    ensurePdfJsDomPolyfill();

    const DOMMatrix = getDomMatrix();
    expect(typeof DOMMatrix).toBe('function');
    const matrix = new DOMMatrix!();
    expect(matrix.isIdentity).toBe(true);
    expect(() => matrix.scaleSelf(1, -1).translateSelf(0, -100)).not.toThrow();
  });

  it('can import parsePdf after DOMMatrix is cleared', async () => {
    clearDomMatrix();
    ensurePdfJsDomPolyfill();
    const loaded = await import('@/lib/parse/parse-pdf');
    expect(typeof loaded.parsePdf).toBe('function');
    expect(typeof getDomMatrix()).toBe('function');
  });
});

describe('parsePdf in Node', () => {
  it('extracts readable text from a text PDF', async () => {
    const buffer = buildMinimalTextPdf('Curriculum photosynthesis lesson for grade 8');
    const parsed = await parsePdf(buffer);

    expect(parsed.type).toBe('pdf');
    expect(parsed.metadata?.ocr).not.toBe(true);
    expect(parsed.text.toLowerCase()).toContain('photosynthesis');
  });

  it('parses PDFs through the lazy upload dispatcher without requiring a browser DOMMatrix', async () => {
    clearDomMatrix();
    ensurePdfJsDomPolyfill();

    const parsed = await parseUploadedFile(
      buildMinimalTextPdf('Student centred lesson with formative assessment'),
      'G 8 G T1 Unit 1 lesson 2.pdf',
    );

    expect(parsed.type).toBe('pdf');
    expect(parsed.text.toLowerCase()).toContain('formative');
  });
});
