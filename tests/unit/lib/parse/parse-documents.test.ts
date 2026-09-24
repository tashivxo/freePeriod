import * as XLSX from 'xlsx';
import { filterDocxXml } from '@/lib/parse/parse-docx';
import { parseXlsx, sheetToVisibleCsv } from '@/lib/parse/parse-xlsx';
import { removeNonVisibleCharacters } from '@/lib/parse/filter-visible-text';
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
