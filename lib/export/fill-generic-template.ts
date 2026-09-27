import JSZip from 'jszip';
import type { LessonPlan } from '@/types';
import { formatGradeLabel } from '@/lib/utils/grades';
import { containsCjk, ensureEastAsiaRFonts } from './cjk';

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

/** True when `idx` starts an OOXML element named `localName` (not a longer prefix like `tcPr`). */
function isWordTagOpen(xml: string, idx: number, localName: string): boolean {
  const tag = `<${localName}`;
  if (!xml.startsWith(tag, idx)) return false;
  const next = xml[idx + tag.length];
  return next === '>' || next === ' ' || next === '/' || next === '\t' || next === '\n';
}

function findWordTagOpen(xml: string, localName: string, from: number): number {
  const tag = `<${localName}`;
  let i = from;
  while (i < xml.length) {
    const idx = xml.indexOf(tag, i);
    if (idx < 0) return -1;
    if (isWordTagOpen(xml, idx, localName)) return idx;
    i = idx + tag.length;
  }
  return -1;
}

function findMatchingWordClose(xml: string, contentStart: number, localName: string): number {
  const close = `</${localName}>`;
  let depth = 0;
  let i = contentStart;
  while (i < xml.length) {
    const nextOpen = findWordTagOpen(xml, localName, i);
    const nextClose = xml.indexOf(close, i);
    if (nextClose < 0) return -1;
    if (nextOpen >= 0 && nextOpen < nextClose) {
      depth += 1;
      i = nextOpen + localName.length + 2;
    } else {
      if (depth === 0) return nextClose;
      depth -= 1;
      i = nextClose + close.length;
    }
  }
  return -1;
}

type XmlSegment = { index: number; xml: string };

/** Direct children only — nested `w:tbl` / `w:tr` / `w:tc` are left inside their parent cell. */
function topLevelWordTags(xml: string, localName: string): XmlSegment[] {
  const segments: XmlSegment[] = [];
  const close = `</${localName}>`;
  let i = 0;
  while (i < xml.length) {
    const start = findWordTagOpen(xml, localName, i);
    if (start < 0) break;
    const openEnd = xml.indexOf('>', start);
    if (openEnd < 0) break;
    const closeIdx = findMatchingWordClose(xml, openEnd + 1, localName);
    if (closeIdx < 0) break;
    const end = closeIdx + close.length;
    segments.push({ index: start, xml: xml.slice(start, end) });
    i = end;
  }
  return segments;
}

function replaceTopLevelWordTags(
  xml: string,
  localName: string,
  replacer: (segmentXml: string) => string,
): string {
  const segments = topLevelWordTags(xml, localName);
  if (segments.length === 0) return xml;
  let result = '';
  let lastEnd = 0;
  for (const segment of segments) {
    result += xml.slice(lastEnd, segment.index) + replacer(segment.xml);
    lastEnd = segment.index + segment.xml.length;
  }
  return result + xml.slice(lastEnd);
}

function stripTrailingParenthetical(text: string): string {
  return text.replace(/\s*\([^)]*\)\s*$/g, '').trim();
}

/** Exact cell text, first line, and first line without a trailing "(…)" hint. */
function labelCandidatesFromCell(cellXml: string): string[] {
  const full = cellPlainText(cellXml);
  const firstLine = (full.split('\n')[0] ?? '').trim();
  return [
    ...new Set(
      [normalizeLabel(full), normalizeLabel(firstLine), normalizeLabel(stripTrailingParenthetical(firstLine))].filter(
        Boolean,
      ),
    ),
  ];
}

function lookupMappedField(
  cellXml: string,
  labelMap: Map<string, string>,
): { key: string; value: string } | undefined {
  for (const candidate of labelCandidatesFromCell(cellXml)) {
    const value = labelMap.get(candidate);
    if (value) return { key: candidate, value };
  }
  return undefined;
}

function getCheckboxSelectionsForCell(cellXml: string, lesson: LessonPlan): string[] | null {
  for (const candidate of labelCandidatesFromCell(cellXml)) {
    const selections = getCheckboxSelections(candidate, lesson);
    if (selections) return selections;
  }
  return null;
}

/** Single short line with no sentence punctuation — a column heading, not sample body copy. */
function looksLikeColumnHeader(text: string): boolean {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length !== 1) return false;
  const line = lines[0];
  if (line.length > 48) return false;
  if (/[.?!]/.test(line)) return false;
  return true;
}

/**
 * Adjacent cells that already have sample/stub text are still fillable. Skip
 * narrow tracking columns (Time), checkbox grids, nested tables, other known
 * labels, and short column headings.
 */
function isFillableValueCell(cellXml: string | undefined, labelMap: Map<string, string>): cellXml is string {
  if (!cellXml) return false;
  if (cellWidthDxa(cellXml) < MIN_VALUE_CELL_WIDTH_DXA) return false;
  if (cellXml.includes('<w:tbl>')) return false;
  if (isCheckboxValueCell(cellXml)) return false;
  if (lookupMappedField(cellXml, labelMap)) return false;
  const text = cellPlainText(cellXml);
  if (text.length > 0 && looksLikeColumnHeader(text)) return false;
  return true;
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
      let rPrToUse = isBoldLine || isSubHeaderLine(content) ? boldRPr : baseRPrNoBold;
      if (containsCjk(text)) {
        rPrToUse = ensureEastAsiaRFonts(rPrToUse);
      }
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

  set(
    [
      'Module Title',
      'Lesson Title',
      'Lesson(s) Title',
      'Lesson Plan Title',
      'Title',
      'Topic',
      'Lesson Topic',
      'Theme',
      'Lesson Theme',
    ],
    c.title || lesson.title,
  );
  set(['Subject'], lesson.subject);
  set(['Grade', 'Grade Level', 'Class', 'Year Group', 'Grade/Class'], formatGradeLabel(lesson.grade));
  set(
    ['Duration', 'Time Allocation', 'Lesson Duration'],
    lesson.duration_minutes ? `${lesson.duration_minutes} minutes` : undefined,
  );
  set(['Essential Question', 'Essential Question(s)'], c.essentialQuestion);
  set(
    [
      'Lesson Objective',
      'Lesson Objective(s)',
      'Learning Objectives',
      'Objectives',
      'Lesson Objectives',
      'Learning Outcomes',
      'Learning Intentions',
      'Aims',
      'Aim',
      'Outcomes',
      'WALT',
    ],
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
    ['Lesson Key Vocabulary', 'Key Vocabulary', 'New Vocabulary', 'New Vocabulary (if any)', 'Vocabulary'],
    joinBullets(c.vocabulary),
  );
  set(
    ['Hook', 'Engage', 'Do Now', 'Anticipatory Set', 'Introduction', 'Starter', 'Warm-up', 'Warm Up', 'Warmup'],
    c.hook,
  );
  const allActivities = [
    ...(c.mainActivities ?? []),
    ...(c.guidedPractice ?? []),
    ...(c.independentPractice ?? []),
  ];
  set(
    [
      'Activities',
      'Main Activities',
      'Lesson Activities',
      'Main Activity',
      'Development',
      'Lesson Development',
      'Presentation',
      'Demonstration of Learning',
      'Activation',
    ],
    joinBlocks(allActivities),
  );
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
  set(
    [
      'Plenary',
      'Evaluate',
      'Exit Ticket',
      'Closure',
      'Conclusion',
      'Wrap-up',
      'Wrap Up',
      'Recap',
      'Summary',
      'Consolidation / Review',
    ],
    c.plenary,
  );
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
 * table cells and writing lesson content into the adjacent value cell in the same row,
 * even when that cell already has sample or stub text. Nested tables (checkbox grids
 * inside a cell) are walked without truncating the parent table. This supports
 * templates designed for a human to type into, rather than templates authored with
 * docx-templates command syntax (e.g. +++INS field+++).
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

  const newXml = replaceTopLevelWordTags(xml, 'w:tbl', (tblMatch) =>
    replaceTopLevelWordTags(tblMatch, 'w:tr', (rowMatch) => {
      const cellMatches = topLevelWordTags(rowMatch, 'w:tc');
      if (cellMatches.length < 1) return rowMatch;

      const cellsXml = cellMatches.map((m) => m.xml);
      let changed = false;

      for (let i = 0; i < cellsXml.length; i++) {
        const checkboxSelections = getCheckboxSelectionsForCell(cellsXml[i], lesson);
        const valueCell = cellsXml[i + 1];
        if (checkboxSelections && valueCell && isCheckboxValueCell(valueCell)) {
          cellsXml[i + 1] = highlightCheckboxCell(valueCell, checkboxSelections);
          changed = true;
          filledCount += 1;
          matchedLabels.push(labelCandidatesFromCell(cellsXml[i])[0] ?? '');
          continue;
        }

        const mapped = lookupMappedField(cellsXml[i], labelMap);
        if (!mapped) continue;

        const fullLabel = normalizeLabel(cellPlainText(cellsXml[i]));
        if (ALWAYS_APPEND_LABELS.has(mapped.key) || ALWAYS_APPEND_LABELS.has(fullLabel)) {
          cellsXml[i] = appendParagraphsToCell(cellsXml[i], mapped.value);
          changed = true;
          filledCount += 1;
          matchedLabels.push(mapped.key);
          continue;
        }

        const nextCell = cellsXml[i + 1];
        if (isFillableValueCell(nextCell, labelMap)) {
          cellsXml[i + 1] = replaceCellParagraphs(nextCell, mapped.value);
          changed = true;
          filledCount += 1;
          matchedLabels.push(mapped.key);
          continue;
        }

        // No dedicated (wide-enough) adjacent value cell — e.g. the label sits next to
        // a narrow tracking column like "Time". If the label's own cell is wide, treat
        // it as a combined label+value cell and append the content below the label.
        if (cellWidthDxa(cellsXml[i]) >= MIN_SELF_FILL_LABEL_WIDTH_DXA) {
          cellsXml[i] = appendParagraphsToCell(cellsXml[i], mapped.value);
          changed = true;
          filledCount += 1;
          matchedLabels.push(mapped.key);
        }
      }

      if (!changed) return rowMatch;

      let result = '';
      let lastEnd = 0;
      cellMatches.forEach((m, i) => {
        result += rowMatch.slice(lastEnd, m.index) + cellsXml[i];
        lastEnd = m.index + m.xml.length;
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
