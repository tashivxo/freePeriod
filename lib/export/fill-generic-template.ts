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
  const withLineBreaks = cellXml
    .replace(/<\/w:p>/g, '\n')
    .replace(/<w:br\s*\/?>/g, '\n')
    .replace(/<\/w:tc>/g, '\n');
  const decoded = decodeXmlEntities(withLineBreaks.replace(/<[^>]+>/g, ''));
  return decoded
    .replace(/[ \t]+/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\n\s*\n/g, '\n')
    .trim();
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
      const isBoldLine = trimmed.startsWith('>>');
      const content = isBoldLine ? trimmed.slice(2).trim() : trimmed;
      const rPrToUse = isBoldLine || isSubHeaderLine(content) ? boldRPr : baseRPrNoBold;
      return `<w:p>${pPrXml}<w:r>${rPrToUse}<w:t xml:space="preserve">${escapeXml(content)}</w:t></w:r></w:p>`;
    })
    .join('');
}

function replaceCellParagraphs(cellXml: string, text: string): string {
  const paraMatch = cellXml.match(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/);
  if (!paraMatch) return cellXml;

  const paragraphsXml = buildParagraphsXml(paraMatch[0], text);
  const withoutParas = cellXml.replace(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g, '');
  return withoutParas.replace('</w:tc>', `${paragraphsXml}</w:tc>`);
}

function isCheckboxValueCell(cellXml: string): boolean {
  return /please highlight all that apply/i.test(cellPlainText(cellXml));
}

function splitCheckboxOptions(body: string): string[] {
  const lines = body.split('\n').map((line) => line.trim()).filter(Boolean);
  const options: string[] = [];

  for (const line of lines) {
    if (line.toLowerCase().startsWith('if ‘other’') || line.toLowerCase().startsWith('if "other"')) {
      options.push(line);
      continue;
    }

    if (/\d-\s*/.test(line)) {
      const parts = line.split(/,\s*(?=\d+[\s\-/])/).map((p) => p.trim()).filter(Boolean);
      options.push(...parts);
      continue;
    }

    if (line.includes('/')) {
      const parts = line.split(/\s*\/\s*/).map((p) => p.trim()).filter(Boolean);
      options.push(...parts);
      continue;
    }

    if (line.includes(',')) {
      const parts = line.split(/,\s*/).map((p) => p.trim()).filter(Boolean);
      options.push(...parts);
      continue;
    }

    options.push(line);
  }

  return options;
}

function optionIsSelected(option: string, selections: string[]): boolean {
  const normalizedOption = option.replace(/^\d-\s*/, '').trim().toLowerCase();
  return selections.some((selection) => {
    const normalizedSelection = selection.trim().toLowerCase();
    if (!normalizedSelection) return false;
    if (
      normalizedOption.includes(normalizedSelection) ||
      normalizedSelection.includes(normalizedOption)
    ) {
      return true;
    }
    const keywords = normalizedSelection.split(/\s+/).filter((word) => word.length > 4);
    return keywords.length > 0 && keywords.filter((word) => normalizedOption.includes(word)).length >= 2;
  });
}

function highlightCheckboxCell(cellXml: string, selections: string[]): string {
  if (!isCheckboxValueCell(cellXml) || selections.length === 0) return cellXml;

  const plain = cellPlainText(cellXml);
  const prefixMatch = plain.match(/^(Please highlight all that apply:?\s*)/i);
  if (!prefixMatch) return cellXml;

  const prefix = prefixMatch[1].trim();
  const body = plain.slice(prefixMatch[1].length);
  const separator = body.includes('/') && !/\d-\s/.test(body) ? ' / ' : ', ';
  const options = splitCheckboxOptions(body);
  const lines = [
    prefix,
    ...options.map((option) => (optionIsSelected(option, selections) ? `>>${option}` : option)),
  ];

  return replaceCellParagraphs(cellXml, lines.join('\n'));
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

function inferHigherOrderThinking(objectives: string[]): string[] {
  const text = objectives.join(' ').toLowerCase();
  const skills: string[] = [];
  if (/analy/.test(text)) skills.push('Analysis');
  if (/evaluat/.test(text)) skills.push('Evaluation');
  if (/compar|connect/.test(text)) skills.push('Making connections');
  if (/conclud|explain|justif/.test(text)) skills.push('Drawing conclusions', 'Constructing explanation');
  if (/argu|debate|defend/.test(text)) skills.push('Arguing a position');
  if (/creat|design|construct/.test(text)) skills.push('Creating');
  if (/hypothes/.test(text)) skills.push('Hypothesis generation');
  if (/reason/.test(text)) skills.push('Reasoning');
  if (skills.length === 0) {
    return ['Analysis', 'Evaluation', 'Making connections'];
  }
  return [...new Set(skills)];
}

const SEP_OPTIONS = [
  'Asking Questions and Defining Problems',
  'Developing and Using Models',
  'Planning and Carrying Out Investigations',
  'Analyzing and Interpreting Data',
  'Using Mathematics and Computational Thinking',
  'Constructing Explanations and Designing Solutions',
  'Engaging in Argument from Evidence',
  'Obtaining, Evaluating, and Communicating Information',
];

const SCIENTIFIC_METHOD_OPTIONS = [
  'Make an observation',
  'Ask a research question',
  'Gather background information and do research',
  'Formulate a hypothesis',
  'Make a prediction',
  'Plan the experiment (Design the investigation and identify variables)',
  'Conduct the experiment',
  'Collect and record data',
  'Analyze, interpret, and evaluate data',
  'Draw conclusion based on evidence',
  'Communicate findings and results',
  'Reflect and propose next steps or further investigations',
];

const TWENTY_FIRST_CENTURY_OPTIONS = [
  'Critical thinking',
  'creativity',
  'Collaboration',
  'Communication',
  'Adaptability and flexibility',
  'Creative thinking',
  'Innovation',
  'Productivity',
  'Accountability',
  'Leadership',
  'Responsibility',
];

const CROSS_CURRICULAR_OPTIONS = [
  'Digital Literacy',
  'Numeracy',
  'Sustainability',
  'Literacy',
  'AI',
  'Social Studies',
];

const SEATING_OPTIONS = [
  'Individual',
  'Pairs',
  'Groups (same level)',
  'Groups (mixed levels)',
  'Workstations (rotations)',
  'Flexible',
  'U-shape',
];

function lessonTextBlob(lesson: LessonPlan): string {
  return JSON.stringify(lesson.content).toLowerCase();
}

function matchOptionsFromBlob(options: string[], blob: string, extraTerms: string[] = []): string[] {
  const terms = [...options, ...extraTerms];
  return options.filter((option) => {
    const keywords = option.toLowerCase().split(/\s+/).filter((word) => word.length > 4);
    if (keywords.length === 0) return false;
    const hits = keywords.filter((word) => blob.includes(word)).length;
    return hits >= Math.min(2, keywords.length);
  });
}

function matchSepSelections(lesson: LessonPlan): string[] {
  const c = lesson.content;
  const explicit = (c.sciencePractices ?? []).map((item) => item.replace(/^\d+\s*[-.)]?\s*/, ''));
  const blob = lessonTextBlob(lesson);
  const matched = matchOptionsFromBlob(SEP_OPTIONS, blob, explicit);
  if (matched.length > 0) return matched;
  return ['Developing and Using Models', 'Planning and Carrying Out Investigations'];
}

function matchScientificMethodSelections(lesson: LessonPlan): string[] {
  const blob = lessonTextBlob(lesson);
  const matched = matchOptionsFromBlob(SCIENTIFIC_METHOD_OPTIONS, blob);
  if (matched.length > 0) return matched;
  return [
    'Make an observation',
    'Ask a research question',
    'Collect and record data',
    'Analyze, interpret, and evaluate data',
    'Draw conclusion based on evidence',
  ];
}

function matchTwentyFirstCenturySelections(lesson: LessonPlan): string[] {
  const blob = lessonTextBlob(lesson);
  const matched = matchOptionsFromBlob(TWENTY_FIRST_CENTURY_OPTIONS, blob);
  if (matched.length > 0) return matched;
  return ['Critical thinking', 'Collaboration', 'Communication'];
}

function matchCrossCurricularSelections(lesson: LessonPlan): string[] {
  const blob = lessonTextBlob(lesson);
  const matched = matchOptionsFromBlob(CROSS_CURRICULAR_OPTIONS, blob);
  if (matched.length > 0) return matched;
  if (/science|math|literacy|digital|ai/.test(blob)) {
    return ['Literacy', 'Numeracy'];
  }
  return ['Literacy'];
}

function matchSeatingSelections(lesson: LessonPlan): string[] {
  const blob = lessonTextBlob(lesson);
  const matched: string[] = [];
  if (/individual|independent|worksheet/.test(blob)) matched.push('Individual');
  if (/pair|partner/.test(blob)) matched.push('Pairs');
  if (/group/.test(blob)) matched.push('Groups (mixed levels)');
  if (/station|rotate|rotation/.test(blob)) matched.push('Workstations (rotations)');
  if (matched.length > 0) return matched;
  return ['Pairs', 'Groups (mixed levels)'];
}

function deriveFiveEPhases(content: LessonPlan['content']): string {
  const phases: string[] = [];
  if (content.hook) phases.push('Engage');
  if (content.mainActivities.length > 0) phases.push('Explore');
  if (content.mainActivities.length > 1 || content.guidedPractice.length > 0) phases.push('Explain');
  if (content.independentPractice.length > 0 || content.guidedPractice.length > 0) {
    phases.push('Elaborate');
  }
  if (content.plenary) phases.push('Evaluate');
  return [...new Set(phases)].join(' / ');
}

function formatAssessmentBlock(content: LessonPlan['content']): string {
  const items = content.formativeAssessment ?? [];
  return [
    'Performance task:',
    items[0] ?? 'Students demonstrate understanding through a structured performance task linked to lesson objectives.',
    'Writing activities:',
    items[1] ?? items[0] ?? 'Short written response explaining key concepts using lesson vocabulary.',
    'Quizzes:',
    items[2] ?? 'Exit ticket or short quiz checking core concepts and vocabulary.',
  ].join('\n');
}

function formatHomework(content: LessonPlan['content']): string {
  if (content.independentPractice.length > 0) {
    return joinBlocks(content.independentPractice);
  }
  return 'Complete a short reflection or practice task reinforcing the lesson objectives and vocabulary.';
}

function formatStemProject(content: LessonPlan['content']): string {
  if (content.realWorldConnections.length > 0) {
    return joinBullets(content.realWorldConnections);
  }
  return 'Optional extension: design a simple model or investigation connected to the lesson phenomenon.';
}

type CheckboxFieldConfig = {
  labels: string[];
  getSelections: (lesson: LessonPlan) => string[];
};

const CHECKBOX_FIELDS: CheckboxFieldConfig[] = [
  {
    labels: [
      'Module Science & Engineering Practices (SEPs',
      'Module Science & Engineering Practices (SEPs)',
      'Science & Engineering Practices',
    ],
    getSelections: matchSepSelections,
  },
  {
    labels: ['Steps of the Scientific Methods', 'Steps of the Scientific Method'],
    getSelections: matchScientificMethodSelections,
  },
  {
    labels: ['Higher-Order Thinking Focus', 'Higher Order Thinking Focus', 'Higher-Order Thinking'],
    getSelections: (lesson) => inferHigherOrderThinking(lesson.content.objectives),
  },
  {
    labels: ['21st Century Skills / Global Competencies', '21st Century Skills', 'Global Competencies'],
    getSelections: matchTwentyFirstCenturySelections,
  },
  {
    labels: ['Cross-Curricular Connections'],
    getSelections: matchCrossCurricularSelections,
  },
  {
    labels: ['Seating Arrangements'],
    getSelections: matchSeatingSelections,
  },
];

function getCheckboxSelections(label: string, lesson: LessonPlan): string[] | null {
  const config = CHECKBOX_FIELDS.find((field) =>
    field.labels.some((candidate) => normalizeLabel(candidate) === label),
  );
  return config ? config.getSelections(lesson) : null;
}

const ALWAYS_APPEND_LABELS = new Set([
  normalizeLabel('5E Model Phase(e.g. Engage/ Explore/ Explain/ Elaborate/ Evaluate)'),
  normalizeLabel('AssessmentPerformance task:Writing activities:Quizzes:'),
]);

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
    ['Module Performance Expectations (PEs)', 'Performance Expectations', 'PEs'],
    joinBullets(c.performanceExpectations),
  );
  set(
    ['Module Prior Knowledge', 'Prior Knowledge', 'Previous Knowledge', 'Background Knowledge'],
    joinBullets(c.priorKnowledge),
  );
  set(
    ['Lesson Possible Misconception(s)', 'Possible Misconceptions', 'Common Misconceptions'],
    joinBullets(c.misconceptions),
  );
  set(
    [
      'Module Science & Engineering Practices (SEPs',
      'Module Science & Engineering Practices (SEPs)',
      'Science & Engineering Practices',
      'Science and Engineering Practices',
    ],
    joinBullets(c.sciencePractices),
  );
  set(['Key Concepts'], joinBullets(c.keyConcepts));
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
  set(['Real World Connections', 'UAE Links'], joinBullets(c.realWorldConnections));
  set(
    ['5E Model Phase(e.g. Engage/ Explore/ Explain/ Elaborate/ Evaluate)', '5E Model Phase'],
    deriveFiveEPhases(c),
  );
  set(
    ['AssessmentPerformance task:Writing activities:Quizzes:', 'Assessment'],
    formatAssessmentBlock(c),
  );
  set(['Homework'], formatHomework(c));
  set(['STEM Project'], formatStemProject(c));

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
        const checkboxSelections = getCheckboxSelections(cellsLabel[i], lesson);
        const valueCell = cellsXml[i + 1];
        if (checkboxSelections && valueCell && isCheckboxValueCell(valueCell)) {
          cellsXml[i + 1] = highlightCheckboxCell(valueCell, checkboxSelections);
          changed = true;
          filledCount += 1;
          matchedLabels.push(cellsLabel[i]);
          continue;
        }

        const mapped = labelMap.get(cellsLabel[i]);
        if (!mapped) continue;

        if (ALWAYS_APPEND_LABELS.has(cellsLabel[i])) {
          cellsXml[i] = appendParagraphsToCell(cellsXml[i], mapped);
          changed = true;
          filledCount += 1;
          matchedLabels.push(cellsLabel[i]);
          continue;
        }

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

export {
  buildFieldMap,
  normalizeLabel,
  cellPlainText,
  inferHigherOrderThinking,
  highlightCheckboxCell,
  getCheckboxSelections,
};
