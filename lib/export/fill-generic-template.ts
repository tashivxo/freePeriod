import JSZip from 'jszip';
import type { LessonPlan } from '@/types';

const DOCUMENT_XML_PATH = 'word/document.xml';
const DEFAULT_RESOURCES = 'Whiteboard / projector, teacher-created handout';

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function cellPlainText(cellXml: string): string {
  return decodeXmlEntities(cellXml.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

function normalizeLabel(text: string): string {
  return text.toLowerCase().replace(/[():]/g, '').replace(/\s+/g, ' ').trim();
}

function cellWidthDxa(cellXml: string): number {
  const match = cellXml.match(/<w:tcW w:w="(\d+)"/);
  return match ? parseInt(match[1], 10) : 0;
}

// A real "value" cell needs enough width to hold free text (e.g. Essential Question's
// value cell is 12828 dxa). Narrow tracking columns — like this template's vertically
// merged "Time" column at 1038 dxa — are too small to be a legitimate fill target,
// even though they're empty.
const MIN_VALUE_CELL_WIDTH_DXA = 1600;
// If the label cell itself is this wide, it's a "label + content" cell (like the
// Session Plan table's "Activities" cell) where the value should be appended inside
// the same cell below the label, not written into an unrelated neighboring column.
const MIN_SELF_FILL_LABEL_WIDTH_DXA = 5000;

function joinBullets(items: string[] | undefined): string {
  if (!items?.length) return '';
  return items.map((item) => `• ${item}`).join('\n');
}

/**
 * Like joinBullets, but separates each item with a blank line so multi-line
 * activity blocks (each with its own Time/Teacher/Learner/Resources sub-lines)
 * don't visually run into one another once rendered as paragraphs.
 */
function joinBlocks(items: string[] | undefined): string {
  if (!items?.length) return '';
  return items.map((item) => `• ${item}`).join('\n\n');
}

/** Heuristic: a short line ending in ':' that isn't itself a bullet/dash item is a sub-header. */
function isSubHeaderLine(line: string): boolean {
  return /:$/.test(line) && line.length < 60 && !line.startsWith('•') && !line.startsWith('-');
}

/** Builds separate `<w:p>` paragraphs for each line of text, reusing a reference paragraph's
 * run/paragraph properties so inserted text matches the template's font/style. Blank lines
 * render as spacer paragraphs, and short "Label:" lines are bolded to separate sub-sections.
 * Rendering each line as its own paragraph (rather than one paragraph with manual <w:br/>
 * breaks) gives proper spacing — this template's Normal style defines none by default,
 * which otherwise causes dense, hard-to-read text when many lines are crammed together. */
function buildParagraphsXml(referencePara: string, text: string): string {
  const rPrMatch = referencePara.match(/<w:rPr>[\s\S]*?<\/w:rPr>/);
  const baseRPr = rPrMatch ? rPrMatch[0] : '';
  // Strip any existing bold tags before re-adding, so we never emit duplicate
  // <w:b/>/<w:bCs/> elements (which can trigger a "repair" prompt in Word).
  const baseRPrNoBold = baseRPr.replace(/<w:b\s*\/>/g, '').replace(/<w:bCs\s*\/>/g, '');
  const boldRPr = baseRPrNoBold
    ? baseRPrNoBold.replace('<w:rPr>', '<w:rPr><w:b/><w:bCs/>')
    : '<w:rPr><w:b/><w:bCs/></w:rPr>';

  const pPrMatch = referencePara.match(/<w:pPr>[\s\S]*?<\/w:pPr>/);
  const pPrWithoutRPr = pPrMatch ? pPrMatch[0].replace(/<w:rPr>[\s\S]*?<\/w:rPr>/, '') : '<w:pPr></w:pPr>';
  const pPrXml = pPrWithoutRPr.includes('<w:spacing')
    ? pPrWithoutRPr
    : pPrWithoutRPr.replace('</w:pPr>', '<w:spacing w:after="80"/></w:pPr>');

  return text
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return `<w:p>${pPrXml}</w:p>`;
      const rPrToUse = isSubHeaderLine(trimmed) ? boldRPr : baseRPr;
      return `<w:p>${pPrXml}<w:r>${rPrToUse}<w:t xml:space="preserve">${escapeXml(trimmed)}</w:t></w:r></w:p>`;
    })
    .join('');
}

/** Injects text into an (empty) table cell by replacing its first paragraph with one
 * paragraph per line (see buildParagraphsXml). Used when the cell is a dedicated,
 * currently-empty value slot next to a label cell. */
function injectTextIntoCell(cellXml: string, text: string): string {
  const paraMatch = cellXml.match(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/);
  if (!paraMatch) return cellXml;

  const paragraphsXml = buildParagraphsXml(paraMatch[0], text);
  if (!paragraphsXml) return cellXml;
  return cellXml.replace(paraMatch[0], paragraphsXml);
}

/** Appends text as new paragraphs at the end of a cell that already contains a label
 * (e.g. "Activities"), for templates where the label and its value share one wide cell
 * instead of the value living in a separate adjacent cell. */
function appendParagraphsToCell(cellXml: string, text: string): string {
  const paraMatches = [...cellXml.matchAll(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g)];
  const lastPara = paraMatches[paraMatches.length - 1]?.[0];
  if (!lastPara) return cellXml;

  const paragraphsXml = buildParagraphsXml(lastPara, text);
  if (!paragraphsXml) return cellXml;
  return cellXml.replace(/<\/w:tc>$/, `${paragraphsXml}</w:tc>`);
}

/** Maps normalized label text (as found in a template's table cells) to lesson content. */
function buildFieldMap(lesson: LessonPlan): Map<string, string> {
  const c = lesson.content;
  const map = new Map<string, string>();

  const set = (labels: string[], value: string | undefined) => {
    const v = value?.trim();
    if (!v) return;
    for (const label of labels) map.set(normalizeLabel(label), v);
  };

  set(['Module Title', 'Lesson Title', 'Lesson(s) Title', 'Lesson Plan Title', 'Title'], c.title || lesson.title);
  set(['Essential Question', 'Essential Question(s)'], c.essentialQuestion);
  set(
    ['Lesson Objective', 'Lesson Objective(s)', 'Learning Objectives', 'Objectives', 'Lesson Objectives'],
    joinBullets(c.objectives),
  );
  set(['Success Criteria', 'Success Criteria(s)'], joinBullets(c.successCriteria));
  set(
    ['Module Performance Expectations (PEs)', 'Performance Expectations', 'Key Concepts'],
    joinBullets(c.keyConcepts),
  );
  set(
    ['Lesson Key Vocabulary', 'Key Vocabulary', 'New Vocabulary', 'Vocabulary'],
    joinBullets(c.vocabulary),
  );
  set(['Hook', 'Engage', 'Do Now', 'Anticipatory Set'], c.hook);
  const allActivities = [
    ...(c.mainActivities ?? []),
    ...(c.guidedPractice ?? []),
    ...(c.independentPractice ?? []),
  ];
  set(['Activities', 'Main Activities', 'Lesson Activities'], joinBlocks(allActivities));
  set(['Guided Practice'], joinBlocks(c.guidedPractice));
  set(['Independent Practice'], joinBlocks(c.independentPractice));
  set(
    ['Formative Assessment', 'Assessment', 'Formative Assessment Methods'],
    joinBullets(c.formativeAssessment),
  );
  set(
    ['Differentiated Instruction', 'Differentiation', 'Adaptive Teaching / Differentiation'],
    [
      ...(c.differentiation?.support ?? []).map((s) => `Support: ${s}`),
      ...(c.differentiation?.extension ?? []).map((s) => `Extension: ${s}`),
    ].join('\n\n'),
  );
  set(['EL Support', 'SEN'], joinBullets(c.differentiation?.support));
  set(['G&T', 'Gifted & Talented (G&T)'], joinBullets(c.differentiation?.extension));
  set(['Plenary', 'Evaluate', 'Exit Ticket', 'Closure'], c.plenary);
  set(['Materials', 'Resources'], DEFAULT_RESOURCES);
  set(
    ['Real World Connections', 'Cross-Curricular Connections', 'UAE Links'],
    joinBullets(c.realWorldConnections),
  );

  return map;
}

export type FillGenericTemplateResult = {
  buffer: Buffer;
  filledCount: number;
  matchedLabels: string[];
};

/**
 * Fills a plain (non-command) DOCX template by locating known field labels in its
 * table cells and writing lesson content into the adjacent empty cell in the same row.
 * This supports templates that were designed for a human to type into, rather than
 * templates authored with docx-templates command syntax (e.g. +++INS field+++).
 */
export async function fillGenericDocxTemplate(
  templateBuffer: Buffer,
  lesson: LessonPlan,
): Promise<FillGenericTemplateResult> {
  const zip = await JSZip.loadAsync(templateBuffer);
  const file = zip.file(DOCUMENT_XML_PATH);
  if (!file) return { buffer: templateBuffer, filledCount: 0, matchedLabels: [] };

  const xml = await file.async('string');
  const labelMap = buildFieldMap(lesson);
  let filledCount = 0;
  const matchedLabels: string[] = [];

  const newXml = xml.replace(/<w:tbl>[\s\S]*?<\/w:tbl>/g, (tblMatch) =>
    tblMatch.replace(/<w:tr\b[^>]*>[\s\S]*?<\/w:tr>/g, (rowMatch) => {
      const cellMatches = [...rowMatch.matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)];
      if (cellMatches.length < 1) return rowMatch;

      const cellsXml = cellMatches.map((m) => m[0]);
      const cellsLabel = cellsXml.map((cellXml) => normalizeLabel(cellPlainText(cellXml)));
      let changed = false;

      for (let i = 0; i < cellsXml.length; i++) {
        const mapped = labelMap.get(cellsLabel[i]);
        if (!mapped) continue;

        const nextCell = cellsXml[i + 1];
        const nextIsEmptyValueCell =
          nextCell !== undefined &&
          cellPlainText(nextCell).length === 0 &&
          cellWidthDxa(nextCell) >= MIN_VALUE_CELL_WIDTH_DXA;

        if (nextIsEmptyValueCell) {
          cellsXml[i + 1] = injectTextIntoCell(nextCell, mapped);
          changed = true;
          filledCount += 1;
          matchedLabels.push(cellsLabel[i]);
          continue;
        }

        // No dedicated (wide-enough) adjacent value cell — e.g. the label sits next to
        // a narrow tracking column like "Time". If the label's own cell is wide, treat
        // it as a combined label+value cell and append the content below the label.
        if (cellWidthDxa(cellsXml[i]) >= MIN_SELF_FILL_LABEL_WIDTH_DXA) {
          cellsXml[i] = appendParagraphsToCell(cellsXml[i], mapped);
          changed = true;
          filledCount += 1;
          matchedLabels.push(cellsLabel[i]);
        }
      }

      if (!changed) return rowMatch;

      let result = '';
      let lastEnd = 0;
      cellMatches.forEach((m, i) => {
        result += rowMatch.slice(lastEnd, m.index) + cellsXml[i];
        lastEnd = (m.index ?? 0) + m[0].length;
      });
      result += rowMatch.slice(lastEnd);
      return result;
    }),
  );

  zip.file(DOCUMENT_XML_PATH, newXml);
  const buffer = Buffer.from(await zip.generateAsync({ type: 'nodebuffer' }));
  return { buffer, filledCount, matchedLabels };
}

export { buildFieldMap, normalizeLabel, cellPlainText };
