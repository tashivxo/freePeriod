import JSZip from 'jszip';

export type DocxTableSummary = {
  index: number;
  rows: number;
  firstRowCells: number;
  gridCols: number[];
  gridSum: number;
};

export type DocxStructureSummary = {
  tableCount: number;
  tables: DocxTableSummary[];
  headers: Record<string, boolean>;
};

const REQUIRED_HEADERS = [
  'Lesson Title',
  'Curriculum Standards / Assessment Information',
  'Planning and Pedagogical Approach',
  'Teacher Activity',
  'Learner Activity',
  'Self-Reflection: Data-Informed Future Planning',
  'Learning Objectives',
  'Teaching Strategies',
] as const;

export function analyzeDocxTables(xml: string): DocxTableSummary[] {
  return [...xml.matchAll(/<w:tbl>([\s\S]*?)<\/w:tbl>/g)].map((match, index) => {
    const tbl = match[1];
    const rows = (tbl.match(/<w:tr[\s>]/g) || []).length;
    const firstRow = tbl.match(/<w:tr[^>]*>([\s\S]*?)<\/w:tr>/);
    const firstRowCells = firstRow ? (firstRow[1].match(/<w:tc[\/>]/g) || []).length : 0;
    const gridCols = [...tbl.matchAll(/<w:gridCol w:w="(\d+)"/g)].map((x) => Number(x[1]));
    return {
      index: index + 1,
      rows,
      firstRowCells,
      gridCols,
      gridSum: gridCols.reduce((a, b) => a + b, 0),
    };
  });
}

export function docxUsesFixedTableLayout(xml: string): boolean {
  const tables = [...xml.matchAll(/<w:tbl>([\s\S]*?)<\/w:tbl>/g)];
  if (tables.length === 0) return false;
  return tables.every((match) => /<w:tblLayout w:type="fixed"/.test(match[1]));
}

export async function summarizeDocxStructure(buffer: Buffer): Promise<DocxStructureSummary> {
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file('word/document.xml')?.async('string');
  if (!xml) {
    throw new Error('Invalid DOCX: missing word/document.xml');
  }

  const tables = analyzeDocxTables(xml);
  const headers = Object.fromEntries(
    REQUIRED_HEADERS.map((header) => [header, xml.includes(header)]),
  ) as Record<string, boolean>;

  return { tableCount: tables.length, tables, headers };
}

export function compareTableGridsToTemplate(
  generated: DocxTableSummary[],
  template: DocxTableSummary[],
): string[] {
  const issues: string[] = [];
  const count = Math.max(generated.length, template.length);

  for (let i = 0; i < count; i++) {
    const g = generated[i];
    const t = template[i];
    if (!g) {
      issues.push(`Table ${i + 1}: missing in generated output`);
      continue;
    }
    if (!t) {
      issues.push(`Table ${i + 1}: extra table in generated output`);
      continue;
    }
    if (g.gridCols.length !== t.gridCols.length) {
      issues.push(
        `Table ${i + 1}: column count ${g.gridCols.length} != template ${t.gridCols.length}`,
      );
    }
    if (g.firstRowCells !== t.firstRowCells) {
      issues.push(
        `Table ${i + 1}: first-row cells ${g.firstRowCells} != template ${t.firstRowCells}`,
      );
    }
    if (g.gridSum !== 9360) {
      issues.push(`Table ${i + 1}: grid width ${g.gridSum} != 9360 DXA`);
    }
  }

  return issues;
}

export { REQUIRED_HEADERS };
