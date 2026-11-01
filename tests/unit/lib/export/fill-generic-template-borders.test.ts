/**
 * @jest-environment node
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { TextEncoder, TextDecoder } from 'util';
import JSZip from 'jszip';
import { cellPlainText, fillGenericDocxTemplate } from '@/lib/export/fill-generic-template';
import type { LessonPlan } from '@/types';

Object.assign(globalThis, { TextEncoder, TextDecoder });

/**
 * DO NOT REMOVE OR EDIT blank-daily-english-lesson-plan.docx. It is the tester's real
 * template. It defines borders only at table level (w:tblBorders incl. insideH/insideV),
 * has no w:tcBorders, and has vertically merged cells. Apple Pages ignores insideH /
 * insideV on merged cells, so the bottom and right lines vanish unless each cell
 * carries explicit w:tcBorders.
 */
const REAL_FIXTURE = join(__dirname, '../../../fixtures/blank-daily-english-lesson-plan.docx');

const lesson = {
  id: 'cell-borders',
  user_id: 'user-id',
  title: 'Ocean conservation: modal verbs',
  subject: 'English',
  grade: '6',
  curriculum: 'UK',
  duration_minutes: 60,
  model_used: 'test',
  token_count: 0,
  template_path: null,
  created_at: '',
  updated_at: '',
  content: {
    title: 'Ocean conservation: modal verbs',
    essentialQuestion: 'Why must we protect the ocean?',
    objectives: ['Students will use must and have to correctly.'],
    successCriteria: ['I can use must and have to in a sentence.'],
    priorKnowledge: ['Basic conservation vocabulary'],
    misconceptions: ['Must and have to are always interchangeable'],
    keyConcepts: ['Modal verbs express obligation'],
    vocabulary: ['must', 'have to'],
    hook: 'Time: 5 min\nTeacher Activity: hook\nLearner Activity & Success Criteria: watch\nResources: video',
    mainActivities: [],
    guidedPractice: [],
    independentPractice: [],
    formativeAssessment: ['Exit ticket'],
    differentiation: {
      support: ['Bilingual glossary'],
      extension: ['Debate the subtle differences'],
    },
    realWorldConnections: [],
    plenary: 'Time: 5 min',
    templateSlots: {
      activitySupported: 'Work with a teacher model and guided prompts to complete the task.',
      activityExpected: 'Complete the core task independently.',
      activityStretch: 'Extend the task by analysing a further example.',
      successCriteriaSupported: 'I can complete the task with a model and prompts.',
      successCriteriaExtended: 'I can apply this concept to a new scenario.',
      homeworkSupported: 'Review your sentences at home.',
      homeworkExpected: 'Write a short paragraph at home.',
      homeworkStretch: 'Research an organisation at home.',
      homeworkExtension: 'Create a digital presentation at home.',
    },
  },
} as unknown as LessonPlan;

function topLevel(xml: string, tag: string): string[] {
  const out: string[] = [];
  const open = new RegExp(`<${tag}(?=[\\s>/])`, 'g');
  const close = `</${tag}>`;
  let m: RegExpExecArray | null;
  while ((m = open.exec(xml))) {
    let depth = 1;
    let i = xml.indexOf('>', m.index) + 1;
    while (depth > 0) {
      const nextOpen = xml.slice(i).search(new RegExp(`<${tag}(?=[\\s>/])`));
      const nextClose = xml.indexOf(close, i);
      if (nextClose < 0) break;
      if (nextOpen >= 0 && i + nextOpen < nextClose) {
        depth += 1;
        i = i + nextOpen + tag.length + 1;
      } else {
        depth -= 1;
        i = nextClose + close.length;
      }
    }
    out.push(xml.slice(m.index, i));
    open.lastIndex = i;
  }
  return out;
}

/** Every table in document order (parents before the tables nested in their cells). */
function allTables(xml: string): string[] {
  const out: string[] = [];
  const walk = (scope: string) => {
    for (const tbl of topLevel(scope, 'w:tbl')) {
      out.push(tbl);
      for (const row of topLevel(tbl, 'w:tr')) {
        for (const cell of topLevel(row, 'w:tc')) walk(cell.replace(/^<w:tc\b[^>]*>/, ''));
      }
    }
  };
  walk(xml);
  return out;
}

type Edge = { val: string; sz: string; space: string; color: string };
type Edges = Partial<Record<'top' | 'left' | 'bottom' | 'right' | 'insideH' | 'insideV', Edge>>;
const EDGE_NAMES = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'] as const;

function parseEdges(bordersXml: string): Edges {
  const edges: Edges = {};
  for (const name of EDGE_NAMES) {
    const tag = bordersXml.match(new RegExp(`<w:${name}\\b[^>]*/?>`))?.[0];
    if (!tag) continue;
    const attr = (a: string) => tag.match(new RegExp(`w:${a}="([^"]*)"`))?.[1] ?? '';
    edges[name] = { val: attr('val'), sz: attr('sz'), space: attr('space'), color: attr('color') };
  }
  return edges;
}

function tableBorders(tbl: string): Edges | null {
  const tblPr = tbl.match(/<w:tblPr>[\s\S]*?<\/w:tblPr>/)?.[0] ?? '';
  const borders = tblPr.match(/<w:tblBorders>[\s\S]*?<\/w:tblBorders>/)?.[0];
  return borders ? parseEdges(borders) : null;
}

function isVisible(edges: Edges | null): boolean {
  if (!edges) return false;
  return Object.values(edges).some((e) => e && e.val !== 'none' && e.val !== 'nil' && e.val !== '');
}

function ownTcPr(cell: string): string | null {
  return cell.match(/^<w:tc\b[^>]*>\s*(<w:tcPr>[\s\S]*?<\/w:tcPr>|<w:tcPr\/>)/)?.[1] ?? null;
}

function cellBorders(cell: string): Edges | null {
  const tcPr = ownTcPr(cell);
  const borders = tcPr?.match(/<w:tcBorders>[\s\S]*?<\/w:tcBorders>/)?.[0];
  return borders ? parseEdges(borders) : null;
}

function vMerge(cell: string): 'restart' | 'continue' | null {
  const tcPr = ownTcPr(cell) ?? '';
  const tag = tcPr.match(/<w:vMerge\b[^>]*\/?>/)?.[0];
  if (!tag) return null;
  return /w:val="restart"/.test(tag) ? 'restart' : 'continue';
}

function gridSpan(cell: string): number {
  return Number((ownTcPr(cell) ?? '').match(/<w:gridSpan w:val="(\d+)"/)?.[1] ?? 1);
}

type Geometry = { row: number; cell: number; startCol: number; endCol: number; mergeEndRow: number };

/** Independent derivation of where each cell sits, including vMerge extents. */
function geometry(tbl: string): { cells: Geometry[]; rows: number; cols: number } {
  const tblGridCols = (tbl.match(/<w:tblGrid>[\s\S]*?<\/w:tblGrid>/)?.[0].match(/<w:gridCol\b/g) ?? []).length;
  const rows = topLevel(tbl, 'w:tr');
  const cells: Geometry[] = [];
  const rowGridAfter: number[] = [];
  const cellsXml: string[][] = [];
  rows.forEach((row, r) => {
    const trPr = row.match(/<w:trPr>[\s\S]*?<\/w:trPr>/)?.[0] ?? '';
    let col = Number(trPr.match(/<w:gridBefore w:val="(\d+)"/)?.[1] ?? 0);
    rowGridAfter.push(Number(trPr.match(/<w:gridAfter w:val="(\d+)"/)?.[1] ?? 0));
    const rowCells = topLevel(row, 'w:tc');
    cellsXml.push(rowCells);
    rowCells.forEach((cell, c) => {
      const span = gridSpan(cell);
      cells.push({ row: r, cell: c, startCol: col, endCol: col + span - 1, mergeEndRow: r });
      col += span;
    });
  });
  const at = (r: number, c: number) => cells.find((g) => g.row === r && g.cell === c)!;
  for (const g of cells) {
    if (vMerge(cellsXml[g.row][g.cell]) === 'continue') continue;
    let end = g.row;
    for (let r = g.row + 1; r < rows.length; r++) {
      const idx = cellsXml[r].findIndex((_, c) => at(r, c).startCol === g.startCol);
      if (idx < 0 || vMerge(cellsXml[r][idx]) !== 'continue') break;
      end = r;
    }
    g.mergeEndRow = end;
    for (let r = g.row + 1; r <= end; r++) {
      const idx = cellsXml[r].findIndex((_, c) => at(r, c).startCol === g.startCol);
      at(r, idx).mergeEndRow = end;
    }
  }
  const cols =
    tblGridCols ||
    Math.max(...rows.map((_, r) => (cells.filter((g) => g.row === r).pop()?.endCol ?? -1) + 1 + rowGridAfter[r]));
  // A row that stops short because of w:gridAfter has nothing to its right, so its last cell is outer.
  cells.forEach((g) => {
    if (g.endCol + 1 + rowGridAfter[g.row] >= cols) g.endCol = cols - 1;
  });
  return { cells, rows: rows.length, cols };
}

function expectedEdges(borders: Edges, g: Geometry, rows: number, cols: number): Edges {
  const top = g.row === 0 ? borders.top : borders.insideH;
  const bottom = g.mergeEndRow === rows - 1 ? borders.bottom : borders.insideH;
  const left = g.startCol === 0 ? borders.left : borders.insideV;
  const right = g.endCol === cols - 1 ? borders.right : borders.insideV;
  return { top, left, bottom, right };
}

function pickOuterInner(e: Edges): Edges {
  return { top: e.top, left: e.left, bottom: e.bottom, right: e.right };
}

async function fillReal() {
  const template = readFileSync(REAL_FIXTURE);
  const result = await fillGenericDocxTemplate(template, lesson);
  const outXml = await (await JSZip.loadAsync(result.buffer)).file('word/document.xml')!.async('string');
  const inXml = await (await JSZip.loadAsync(template)).file('word/document.xml')!.async('string');
  return { template, inXml, outXml };
}

async function fillXml(documentXml: string) {
  const zip = new JSZip();
  zip.file('word/document.xml', documentXml);
  const buffer = Buffer.from(await zip.generateAsync({ type: 'nodebuffer' }));
  const result = await fillGenericDocxTemplate(buffer, lesson);
  return (await (await JSZip.loadAsync(result.buffer)).file('word/document.xml')!.async('string')) as string;
}

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const SINGLE = '<w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tblBorders>';
const DOUBLE = '<w:tblBorders><w:top w:val="double" w:sz="12" w:space="0" w:color="FF0000"/><w:left w:val="double" w:sz="12" w:space="0" w:color="FF0000"/><w:bottom w:val="double" w:sz="12" w:space="0" w:color="FF0000"/><w:right w:val="double" w:sz="12" w:space="0" w:color="FF0000"/><w:insideH w:val="dashed" w:sz="6" w:space="0" w:color="00FF00"/><w:insideV w:val="dotted" w:sz="8" w:space="0" w:color="0000FF"/></w:tblBorders>';
const NONE = '<w:tblBorders><w:top w:val="none" w:sz="0" w:space="0" w:color="auto"/><w:left w:val="none" w:sz="0" w:space="0" w:color="auto"/><w:bottom w:val="none" w:sz="0" w:space="0" w:color="auto"/><w:right w:val="none" w:sz="0" w:space="0" w:color="auto"/><w:insideH w:val="none" w:sz="0" w:space="0" w:color="auto"/><w:insideV w:val="none" w:sz="0" w:space="0" w:color="auto"/></w:tblBorders>';

const tc = (text: string, tcPrInner = '<w:tcW w:w="2000" w:type="dxa"/>') =>
  `<w:tc><w:tcPr>${tcPrInner}</w:tcPr><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:tc>`;
const tcNoPr = (text: string) => `<w:tc><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:tc>`;
const tbl = (borders: string, grid: number, rows: string[]) =>
  `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/>${borders}</w:tblPr><w:tblGrid>${'<w:gridCol w:w="2000"/>'.repeat(grid)}</w:tblGrid>${rows
    .map((r) => `<w:tr>${r}</w:tr>`)
    .join('')}</w:tbl>`;
const doc = (body: string) => `<?xml version="1.0" encoding="UTF-8"?><w:document ${W}><w:body>${body}<w:sectPr/></w:body></w:document>`;

describe('filled template explicit cell borders (Apple Pages)', () => {
  it('uses the real template as expected: table-level borders only, 4 vMerge cells', async () => {
    const { inXml } = await fillReal();
    const tables = allTables(inXml);
    expect(tables).toHaveLength(9);
    expect(tables.map((t) => isVisible(tableBorders(t)))).toEqual([
      true, true, true, false, false, false, false, false, false,
    ]);
    expect(inXml).not.toMatch(/<w:tcBorders\b/);
    expect(inXml.match(/<w:vMerge\b/g)).toHaveLength(4);
  });

  it('writes tcBorders on every cell of every bordered table, matching outer vs insideH/insideV', async () => {
    const { outXml } = await fillReal();
    const bordered = allTables(outXml).filter((t) => isVisible(tableBorders(t)));
    expect(bordered).toHaveLength(3);

    let checked = 0;
    for (const table of bordered) {
      const borders = tableBorders(table)!;
      const geo = geometry(table);
      const rows = topLevel(table, 'w:tr');
      for (const g of geo.cells) {
        const cell = topLevel(rows[g.row], 'w:tc')[g.cell];
        const actual = cellBorders(cell);
        expect({ row: g.row, cell: g.cell, hasBorders: actual !== null }).toEqual({
          row: g.row,
          cell: g.cell,
          hasBorders: true,
        });
        expect({ row: g.row, cell: g.cell, edges: pickOuterInner(actual!) }).toEqual({
          row: g.row,
          cell: g.cell,
          edges: expectedEdges(borders, g, geo.rows, geo.cols),
        });
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(100);
  });

  it('writes explicit borders on the 4 vMerge cells with the correct outer vs inner edges', async () => {
    const { outXml } = await fillReal();
    const table = allTables(outXml).filter((t) => isVisible(tableBorders(t)))[2];
    const borders = tableBorders(table)!;
    const geo = geometry(table);
    const rows = topLevel(table, 'w:tr');

    const merged = geo.cells
      .map((g) => ({ g, cell: topLevel(rows[g.row], 'w:tc')[g.cell] }))
      .filter(({ cell }) => vMerge(cell) !== null);
    expect(merged.map(({ cell }) => vMerge(cell))).toEqual(['restart', 'continue', 'continue', 'continue']);

    for (const { g, cell } of merged) {
      const actual = cellBorders(cell);
      expect(actual).not.toBeNull();
      for (const name of ['top', 'left', 'bottom', 'right'] as const) {
        expect(actual![name]).toBeDefined();
        expect(actual![name]).toEqual(borders.top); // all six table edges are the same single line here
      }
      expect(pickOuterInner(actual!)).toEqual(expectedEdges(borders, g, geo.rows, geo.cols));
    }

    expect(new Set(merged.map(({ g }) => g.startCol)).size).toBe(1);
    expect(merged[0].g.mergeEndRow).toBe(merged[merged.length - 1].g.row);
  });

  it('distinguishes outer from inner edges when table borders differ', async () => {
    const xml = doc(
      tbl(DOUBLE, 2, [
        tc('A') + tc('B', '<w:tcW w:w="2000" w:type="dxa"/><w:vMerge w:val="restart"/>'),
        tc('C') + tc('', '<w:tcW w:w="2000" w:type="dxa"/><w:vMerge/>'),
        tc('D') + tc('', '<w:tcW w:w="2000" w:type="dxa"/><w:vMerge/>'),
      ]),
    );
    const out = await fillXml(xml);
    const [table] = allTables(out);
    const rows = topLevel(table, 'w:tr').map((r) => topLevel(r, 'w:tc'));
    const b = tableBorders(table)!;
    const edgesOf = (r: number, c: number) => pickOuterInner(cellBorders(rows[r][c])!);

    expect(edgesOf(0, 0)).toEqual({ top: b.top, left: b.left, bottom: b.insideH, right: b.insideV });
    expect(edgesOf(2, 0)).toEqual({ top: b.insideH, left: b.left, bottom: b.bottom, right: b.insideV });
    expect(edgesOf(0, 1)).toEqual({ top: b.top, left: b.insideV, bottom: b.bottom, right: b.right });
    expect(edgesOf(1, 1)).toEqual({ top: b.insideH, left: b.insideV, bottom: b.bottom, right: b.right });
    expect(edgesOf(2, 1)).toEqual({ top: b.insideH, left: b.insideV, bottom: b.bottom, right: b.right });
  });

  it('treats a vMerge that ends before the last row, and gridSpan cells, as inner where appropriate', async () => {
    const xml = doc(
      tbl(DOUBLE, 3, [
        tc('A', '<w:tcW w:w="4000" w:type="dxa"/><w:gridSpan w:val="2"/>') + tc('B'),
        tc('C', '<w:tcW w:w="2000" w:type="dxa"/><w:vMerge w:val="restart"/>') + tc('D') + tc('E'),
        tc('', '<w:tcW w:w="2000" w:type="dxa"/><w:vMerge/>') + tc('F') + tc('G'),
        tc('H') + tc('I', '<w:tcW w:w="4000" w:type="dxa"/><w:gridSpan w:val="2"/>'),
      ]),
    );
    const out = await fillXml(xml);
    const [table] = allTables(out);
    const rows = topLevel(table, 'w:tr').map((r) => topLevel(r, 'w:tc'));
    const b = tableBorders(table)!;
    const edgesOf = (r: number, c: number) => pickOuterInner(cellBorders(rows[r][c])!);

    expect(edgesOf(0, 0)).toEqual({ top: b.top, left: b.left, bottom: b.insideH, right: b.insideV });
    expect(edgesOf(0, 1)).toEqual({ top: b.top, left: b.insideV, bottom: b.insideH, right: b.right });
    expect(edgesOf(1, 0)).toEqual({ top: b.insideH, left: b.left, bottom: b.insideH, right: b.insideV });
    expect(edgesOf(2, 0)).toEqual({ top: b.insideH, left: b.left, bottom: b.insideH, right: b.insideV });
    expect(edgesOf(3, 0)).toEqual({ top: b.insideH, left: b.left, bottom: b.bottom, right: b.insideV });
    expect(edgesOf(3, 1)).toEqual({ top: b.insideH, left: b.insideV, bottom: b.bottom, right: b.right });
  });

  it('keeps tables with all-none tblBorders borderless', async () => {
    const { outXml } = await fillReal();
    const borderless = allTables(outXml).filter((t) => !isVisible(tableBorders(t)));
    expect(borderless).toHaveLength(6);
    for (const table of borderless) {
      expect(table).not.toMatch(/<w:tcBorders\b/);
    }

    const out = await fillXml(doc(tbl(NONE, 2, [tc('A') + tc('B'), tc('C') + tc('D')])));
    expect(out).not.toMatch(/<w:tcBorders\b/);
  });

  it('does not change cell text or table structure', async () => {
    const { template, inXml, outXml } = await fillReal();

    // Oracle: the same fill on a copy of the template whose table borders are all none, so no
    // cell borders are ever added. Everything else the fill does is identical.
    const plainZip = await JSZip.loadAsync(template);
    const plainXml = inXml.replace(/<w:tblBorders>[\s\S]*?<\/w:tblBorders>/g, NONE);
    expect(plainXml).not.toBe(inXml);
    plainZip.file('word/document.xml', plainXml);
    const plainResult = await fillGenericDocxTemplate(
      Buffer.from(await plainZip.generateAsync({ type: 'nodebuffer' })),
      lesson,
    );
    const plainOut = await (await JSZip.loadAsync(plainResult.buffer)).file('word/document.xml')!.async('string');
    expect(plainOut).not.toMatch(/<w:tcBorders\b/);

    const summarise = (xml: string) =>
      allTables(xml).map((t) =>
        topLevel(t, 'w:tr').map((row) =>
          topLevel(row, 'w:tc').map((cell) => ({
            text: cellPlainText(cell),
            vMerge: vMerge(cell),
            gridSpan: gridSpan(cell),
          })),
        ),
      );

    const filled = summarise(outXml);
    expect(filled).toEqual(summarise(plainOut));

    const template_ = summarise(inXml);
    expect(filled).toHaveLength(template_.length);
    filled.forEach((table, t) => {
      expect(table.map((row) => row.length)).toEqual(template_[t].map((row) => row.length));
      expect(table.map((row) => row.map(({ vMerge: v, gridSpan: g }) => ({ v, g })))).toEqual(
        template_[t].map((row) => row.map(({ vMerge: v, gridSpan: g }) => ({ v, g }))),
      );
    });

    const tablesIn = allTables(inXml);
    const tablesOut = allTables(outXml);
    expect(tablesOut).toHaveLength(tablesIn.length);
    expect(topLevel(inXml, 'w:tbl')).toHaveLength(3);
    expect(topLevel(outXml, 'w:tbl')).toHaveLength(3);
    expect(outXml.match(/<w:vMerge\b/g)).toHaveLength(4);
    expect(outXml.match(/<w:gridSpan\b/g)).toHaveLength(inXml.match(/<w:gridSpan\b/g)!.length);
    expect(inXml.match(/<w:gridSpan\b/g)).toHaveLength(47);

    // Stripping the new borders (and any tcPr that only existed to hold them) gives back the plain fill.
    const strip = (xml: string) =>
      xml
        .replace(/<w:tcBorders>[\s\S]*?<\/w:tcBorders>/g, '')
        .replace(/<w:tcPr><\/w:tcPr>/g, '')
        .replace(/<w:tblBorders>[\s\S]*?<\/w:tblBorders>/g, '');
    expect(strip(outXml)).toBe(strip(plainOut));
  });

  it('never overwrites an existing tcBorders', async () => {
    const existing =
      '<w:tcBorders><w:top w:val="thick" w:sz="24" w:space="0" w:color="123456"/><w:left w:val="thick" w:sz="24" w:space="0" w:color="123456"/><w:bottom w:val="thick" w:sz="24" w:space="0" w:color="123456"/><w:right w:val="thick" w:sz="24" w:space="0" w:color="123456"/></w:tcBorders>';
    const xml = doc(
      tbl(SINGLE, 2, [
        tc('A', `<w:tcW w:w="2000" w:type="dxa"/>${existing}`) + tc('B'),
        tc('C') + tcNoPr('D'),
      ]),
    );
    const out = await fillXml(xml);
    const [table] = allTables(out);
    const rows = topLevel(table, 'w:tr').map((r) => topLevel(r, 'w:tc'));

    const kept = ownTcPr(rows[0][0])!.match(/<w:tcBorders>[\s\S]*?<\/w:tcBorders>/g)!;
    expect(kept).toEqual([existing]);

    for (const [r, c] of [[0, 1], [1, 0], [1, 1]]) {
      expect(cellBorders(rows[r][c])).not.toBeNull();
    }
  });

  it('creates tcPr when missing and places tcBorders in schema order', async () => {
    const xml = doc(
      tbl(SINGLE, 2, [
        tcNoPr('A') +
          tc('B', '<w:tcW w:w="2000" w:type="dxa"/><w:gridSpan w:val="1"/><w:shd w:val="clear" w:color="auto" w:fill="E0E0E0"/><w:vAlign w:val="center"/>'),
      ]),
    );
    const out = await fillXml(xml);
    const [table] = allTables(out);
    const [a, b] = topLevel(topLevel(table, 'w:tr')[0], 'w:tc');
    expect(a).toMatch(/^<w:tc>\s*<w:tcPr><w:tcBorders>/);
    const tcPr = ownTcPr(b)!;
    const order = ['w:tcW', 'w:gridSpan', 'w:tcBorders', 'w:shd', 'w:vAlign'].map((t) => tcPr.indexOf(`<${t}`));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((x, y) => x - y)).toEqual(order);
  });

  it('borders nested tables innermost first and leaves a borderless parent alone', async () => {
    const inner = tbl(DOUBLE, 2, [tc('i1') + tc('i2'), tc('i3') + tc('i4')]);
    const nestedInBordered = tbl(SINGLE, 2, [
      tc('x') + `<w:tc><w:tcPr><w:tcW w:w="2000" w:type="dxa"/></w:tcPr>${inner}<w:p/></w:tc>`,
    ]);
    const nestedInBorderless = tbl(NONE, 1, [`<w:tc><w:tcPr><w:tcW w:w="2000" w:type="dxa"/></w:tcPr>${inner}<w:p/></w:tc>`]);
    const out = await fillXml(doc(nestedInBordered + '<w:p/>' + nestedInBorderless));
    const tables = allTables(out);
    expect(tables).toHaveLength(4);

    for (const table of tables) {
      const borders = tableBorders(table)!;
      const geo = geometry(table);
      const rows = topLevel(table, 'w:tr').map((r) => topLevel(r, 'w:tc'));
      for (const g of geo.cells) {
        const cell = rows[g.row][g.cell];
        if (!isVisible(borders)) {
          expect(cellBorders(cell)).toBeNull();
          continue;
        }
        expect(pickOuterInner(cellBorders(cell)!)).toEqual(
          expectedEdges(borders, g, geo.rows, geo.cols),
        );
      }
    }
    const [outerBorderless] = tables.filter((t) => !isVisible(tableBorders(t)));
    expect(topLevel(outerBorderless, 'w:tr').flatMap((r) => topLevel(r, 'w:tc')).length).toBe(1);
  });

  it('draws the right edge of a gridAfter row as outer', async () => {
    const rowWithGridAfter = `<w:trPr><w:gridAfter w:val="1"/></w:trPr>${tc('A')}${tc('B')}`;
    const out = await fillXml(doc(tbl(DOUBLE, 3, [tc('X') + tc('Y') + tc('Z'), rowWithGridAfter])));
    const [table] = allTables(out);
    const b = tableBorders(table)!;
    const rows = topLevel(table, 'w:tr').map((r) => topLevel(r, 'w:tc'));
    expect(pickOuterInner(cellBorders(rows[1][1])!)).toEqual({
      top: b.insideH,
      left: b.insideV,
      bottom: b.bottom,
      right: b.right,
    });
  });
});
