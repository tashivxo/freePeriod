import * as XLSX from 'xlsx';
import { cleanExtractedText } from './filter-visible-text';
import type { ParsedContent } from './types';

function isHiddenSheet(workbook: XLSX.WorkBook, sheetName: string): boolean {
  const sheet = workbook.Workbook?.Sheets?.find((entry) => entry.name === sheetName);
  return Boolean(sheet && sheet.Hidden && sheet.Hidden > 0);
}

export function sheetToVisibleCsv(sheet: XLSX.WorkSheet): string {
  return XLSX.utils.sheet_to_csv(sheet, { skipHidden: true });
}

export function parseXlsx(buffer: Buffer): ParsedContent {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheets: string[] = [];
  const visibleSheetNames: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    if (isHiddenSheet(workbook, sheetName)) continue;
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    // xlsx skips rows/columns marked hidden in !rows/!cols when this option is
    // enabled. If a workbook has no visibility metadata, all cells are kept.
    const csv = sheetToVisibleCsv(sheet);
    visibleSheetNames.push(sheetName);
    sheets.push(`--- ${sheetName} ---\n${csv}`);
  }

  return {
    text: cleanExtractedText(sheets.join('\n\n')),
    type: 'xlsx',
    metadata: { sheets: visibleSheetNames },
  };
}
