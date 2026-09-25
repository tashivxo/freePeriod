import { readFileSync } from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { filterDocxXml, parseDocx } from '@/lib/parse/parse-docx';
import { parseXlsx, sheetToVisibleCsv } from '@/lib/parse/parse-xlsx';
import { removeNonVisibleCharacters } from '@/lib/parse/filter-visible-text';
import {
  parseFailureMessage,
  parseUploadedFile,
  UnsupportedFileTypeError,
} from '@/lib/parse/parse-uploaded-file';
import { requiresExtractedText } from '@/lib/parse/types';

it('requires extracted text for curriculum docs but not templates', () => {
  expect(requiresExtractedText('curriculum_doc')).toBe(true);
  expect(requiresExtractedText(undefined)).toBe(true);
  expect(requiresExtractedText('template')).toBe(false);
});

it('removes non-rendering Unicode controls without removing document whitespace', () => {
  expect(removeNonVisibleCharacters('Visible\u200B text\twith\nbreaks')).toBe(
    'Visible text\twith\nbreaks',
  );
});

it('does not treat empty template text as a hard failure', () => {
  expect(requiresExtractedText('template')).toBe(false);
});

it('keeps pdfjs DOM polyfill imported before pdf-parse', () => {
  const source = readFileSync(path.join(process.cwd(), 'lib/parse/parse-pdf.ts'), 'utf8');
  expect(source.indexOf("import './ensure-pdfjs-dom-polyfill'")).toBeGreaterThanOrEqual(0);
  expect(source.indexOf("import './ensure-pdfjs-dom-polyfill'")).toBeLessThan(
    source.indexOf("from 'pdf-parse'"),
  );
});

it('does not statically import pdf-parse or tesseract from the parse route', () => {
  const source = readFileSync(
    path.join(process.cwd(), 'app/api/parse-document/route.ts'),
    'utf8',
  );
  expect(source).not.toMatch(/from ['"]pdf-parse['"]/);
  expect(source).not.toMatch(/from ['"]@\/lib\/parse\/parse-pdf['"]/);
  expect(source).not.toMatch(/from ['"]@\/lib\/ocr\/tesseract['"]/);
});

it('returns a JSON-safe message for DOMMatrix module-load crashes', () => {
  expect(parseFailureMessage(new ReferenceError('DOMMatrix is not defined'))).toMatch(
    /Failed to read this PDF/i,
  );
  expect(parseFailureMessage(new UnsupportedFileTypeError('bin'))).toBe(
    'Unsupported file type: bin',
  );
  expect(parseFailureMessage(new Error('DOCX document.xml is missing'))).toBe(
    'DOCX document.xml is missing',
  );
});

async function makeDocx(paragraphXml: string): Promise<Buffer> {
  const zip = new JSZip();
  zip.file(
    'word/document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
     <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
       <w:body>${paragraphXml}</w:body>
     </w:document>`,
  );
  return Buffer.from(await zip.generateAsync({ type: 'nodebuffer' }));
}

describe('DOCX visibility filtering', () => {
  it('keeps normal text and drops hidden, tiny, and near-white runs', () => {
    const result = filterDocxXml(`
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:r><w:rPr><w:color w:val="000000"/></w:rPr><w:t>Visible</w:t></w:r>
            <w:r><w:rPr><w:vanish/></w:rPr><w:t>Hidden</w:t></w:r>
            <w:r><w:rPr><w:sz w:val="10"/></w:rPr><w:t>Tiny</w:t></w:r>
            <w:r><w:rPr><w:color w:val="FFFFFF"/></w:rPr><w:t>White</w:t></w:r>
          </w:p>
        </w:body>
      </w:document>
    `);

    expect(result.text).toBe('Visible');
    expect(result.droppedRunCount).toBe(3);
  });

  it('parses a blank lesson-plan template as empty text instead of failing', async () => {
    const buffer = await makeDocx('<w:p><w:r><w:t></w:t></w:r></w:p>');
    const parsed = await parseUploadedFile(buffer, 'Blank Daily English lesson plan template.docx');

    expect(parsed.type).toBe('docx');
    expect(parsed.text.trim()).toBe('');
    expect(requiresExtractedText('template')).toBe(false);
  });

  it('extracts visible text from a real DOCX buffer', async () => {
    const buffer = await makeDocx(
      '<w:p><w:r><w:rPr><w:color w:val="000000"/></w:rPr><w:t>Daily English lesson</w:t></w:r></w:p>',
    );
    const parsed = await parseDocx(buffer);
    expect(parsed.text).toContain('Daily English lesson');
  });
});

describe('XLSX visibility filtering', () => {
  it('skips hidden sheets and hidden rows/columns', () => {
    const workbook = XLSX.utils.book_new();
    const visible = XLSX.utils.aoa_to_sheet([
      ['Visible heading', 'Hidden column'],
      ['Visible row', 'Hidden row'],
    ]);
    visible['!rows'] = [{}, { hidden: true }];
    visible['!cols'] = [{}, { hidden: true }];
    XLSX.utils.book_append_sheet(workbook, visible, 'Visible');
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([['Do not include']]),
      'Hidden',
    );
    workbook.Workbook = {
      Sheets: [{ name: 'Visible', Hidden: 0 }, { name: 'Hidden', Hidden: 1 }],
    };

    expect(sheetToVisibleCsv(visible)).toContain('Visible heading');
    expect(sheetToVisibleCsv(visible)).not.toContain('Hidden column');
    expect(sheetToVisibleCsv(visible)).not.toContain('Hidden row');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    const parsed = parseXlsx(buffer);

    expect(parsed.metadata).toEqual({ sheets: ['Visible'] });
    expect(parsed.text).toContain('Visible heading');
    expect(parsed.text).not.toContain('Do not include');
  });
});
