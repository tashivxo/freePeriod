import JSZip from 'jszip';
import type { LessonPlan } from '@/types';
import { inferTeachingStrategies, parseActivityBlock } from '@/lib/export/docx';
import { formatICanStatements } from '@/lib/export/lesson-document';
import { createT } from '@/lib/i18n/format';
import { formatGradeLabel } from '@/lib/utils/grades';
import { containsCjk, ensureEastAsiaRFonts } from './cjk';

const DOCUMENT_XML_PATH = 'word/document.xml';
const DEFAULT_RESOURCES = 'Whiteboard / projector, teacher-created handout';
const tEn = createT('en');

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
  const match = cellXml.match(/<w:tcW\b[^>]*\bw:w="(\d+)"/);
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

function rebuildRow(rowMatch: string, cellMatches: XmlSegment[], cellsXml: string[]): string {
  let result = '';
  let lastEnd = 0;
  cellMatches.forEach((m, i) => {
    result += rowMatch.slice(lastEnd, m.index) + cellsXml[i];
    lastEnd = m.index + m.xml.length;
  });
  return result + rowMatch.slice(lastEnd);
}

type ParsedActivityFields = ReturnType<typeof parseActivityBlock>;

function isActivityHeaderRow(cellsXml: string[]): boolean {
  if (cellsXml.length < 5) return false;
  const texts = cellsXml.map((cell) => normalizeLabel(cellPlainText(cell)));
  const hasTime = texts.some((text) => text === 'time' || text.startsWith('time '));
  const hasTeacher = texts.some((text) => text.includes('teacher activity'));
  const hasLearner = texts.some((text) => text.includes('learner activity'));
  const hasFormative = texts.some((text) => text.includes('formative'));
  const hasMaterials = texts.some((text) => text.includes('material') || text.includes('resource'));
  return hasTime && hasTeacher && hasLearner && hasFormative && hasMaterials;
}

function isActivityInstructionRow(cellsXml: string[]): boolean {
  if (cellsXml.length < 5) return false;
  return /how are you unpacking/i.test(cellPlainText(cellsXml[1] ?? ''));
}

function activityPhaseKind(
  teacherCellXml: string,
): 'hook' | 'activation' | 'demonstration' | 'plenary' | null {
  const label = normalizeLabel(cellPlainText(teacherCellXml).split('\n')[0] ?? '');
  if (/do now|starter/.test(label)) return 'hook';
  if (/activation|introducing new content/.test(label)) return 'activation';
  if (/demonstration of learning|\bpractice\b/.test(label)) return 'demonstration';
  if (/consolidation|plenary|\breview\b/.test(label)) return 'plenary';
  return null;
}

function isActivityTableRow(cellsXml: string[]): boolean {
  if (cellsXml.length < 5) return false;
  return (
    isActivityHeaderRow(cellsXml) ||
    isActivityInstructionRow(cellsXml) ||
    activityPhaseKind(cellsXml[1] ?? '') != null
  );
}

function mergeParsedActivities(items: string[], fallbackTime: string): ParsedActivityFields | null {
  const parsed = items
    .map((item) => parseActivityBlock(item, fallbackTime))
    .filter((item) => Boolean(item.teacher || item.learner || item.assessment || item.resources));
  if (parsed.length === 0) return null;
  const join = (values: string[]) =>
    values
      .map((value) => value.trim())
      .filter(Boolean)
      .join('\n\n');
  return {
    time: parsed.map((item) => item.time).find((value) => value.trim()) || fallbackTime,
    teacher: join(parsed.map((item) => item.teacher)),
    learner: join(parsed.map((item) => item.learner)),
    assessment: join(parsed.map((item) => item.assessment)),
    resources: join(parsed.map((item) => item.resources)),
  };
}

function activitySourceForPhase(
  kind: NonNullable<ReturnType<typeof activityPhaseKind>>,
  content: LessonPlan['content'],
): { items: string[]; fallbackTime: string; label: string } | null {
  if (kind === 'hook') {
    return content.hook ? { items: [content.hook], fallbackTime: '5 min', label: 'do now' } : null;
  }
  if (kind === 'activation') {
    const item = content.mainActivities?.[0];
    return item ? { items: [item], fallbackTime: '', label: 'activation' } : null;
  }
  if (kind === 'demonstration') {
    const items = [
      ...(content.mainActivities ?? []).slice(1),
      ...(content.guidedPractice ?? []),
      ...(content.independentPractice ?? []),
    ].filter(Boolean);
    if (items.length === 0) return null;
    return { items, fallbackTime: '', label: 'demonstration of learning' };
  }
  return content.plenary
    ? { items: [content.plenary], fallbackTime: '5 min', label: 'consolidation / review' }
    : null;
}

function keepHeadingAndWriteBody(cellXml: string, body: string): string {
  if (!body.trim()) return cellXml;
  const paras = topLevelWordTags(cellXml, 'w:p');
  if (paras.length === 0) return replaceCellParagraphs(cellXml, body);
  const heading = paras[0].xml;
  const bodyXml = buildParagraphsXml(heading, body);
  const withoutParas = cellXml.replace(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g, '');
  return withoutParas.replace('</w:tc>', `${heading}${bodyXml}</w:tc>`);
}

function vMergeKind(cellXml: string): 'restart' | 'continue' | null {
  if (/<w:vMerge\b[^>]*w:val="restart"/.test(cellXml)) return 'restart';
  if (/<w:vMerge\b/.test(cellXml)) return 'continue';
  return null;
}

function isGuidanceLabelText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (/^\[\d+\]/.test(trimmed)) return true;
  if (/homework differentiation/i.test(trimmed)) return true;
  if (/^plenary\b/i.test(trimmed)) return true;
  if (isSubHeaderLine(trimmed)) return true;
  return /:$/.test(trimmed) && trimmed.length < 80;
}

function matchesAtMasteryLabel(label: string): boolean {
  const text = normalizeLabel(label);
  return text.includes('working at mastery') && !text.includes('towards');
}

type LabelRule = {
  match: (label: string) => boolean;
  content: string;
};

function isFallbackHomeLabel(text: string): boolean {
  return (
    /class discussion/i.test(text) ||
    /student participation/i.test(text) ||
    /student-centered approach/i.test(text) ||
    /formal introduction/i.test(text) ||
    /formative data/i.test(text) ||
    /^plenary\b/i.test(text.trim())
  );
}

function fillStructuredCell(cellXml: string, fallbackBody: string, rules: LabelRule[]): string {
  const paras = topLevelWordTags(cellXml, 'w:p');
  if (paras.length === 0) {
    return fallbackBody.trim() ? replaceCellParagraphs(cellXml, fallbackBody) : cellXml;
  }

  const extras = new Map<number, string>();
  const used = new Set<number>();
  let fallbackPlaced = false;

  paras.forEach((para, index) => {
    const label = cellPlainText(para.xml);
    if (!label) return;
    rules.forEach((rule, ruleIndex) => {
      if (used.has(ruleIndex) || !rule.content.trim()) return;
      if (!rule.match(label)) return;
      extras.set(index, (extras.get(index) ?? '') + buildParagraphsXml(para.xml, rule.content));
      used.add(ruleIndex);
      if (rule.content === fallbackBody) fallbackPlaced = true;
    });
  });

  const hasLabels = paras.some((para) => isGuidanceLabelText(cellPlainText(para.xml)));
  if (!hasLabels) {
    return fallbackBody.trim() ? keepHeadingAndWriteBody(cellXml, fallbackBody) : cellXml;
  }

  if (fallbackBody.trim() && !fallbackPlaced) {
    const homeIdx = paras.findIndex((para) => isFallbackHomeLabel(cellPlainText(para.xml)));
    const headingIdx = paras.findIndex((para) => activityPhaseKind(cellPlainText(para.xml)) != null);
    const insertAt = homeIdx >= 0 ? homeIdx : headingIdx;
    if (insertAt >= 0) {
      extras.set(
        insertAt,
        (extras.get(insertAt) ?? '') + buildParagraphsXml(paras[insertAt].xml, fallbackBody),
      );
    }
  }

  if (extras.size === 0) return cellXml;

  let result = '';
  let lastEnd = 0;
  paras.forEach((para, index) => {
    result += cellXml.slice(lastEnd, para.index) + para.xml;
    const extra = extras.get(index);
    if (extra) result += extra;
    lastEnd = para.index + para.xml.length;
  });
  return result + cellXml.slice(lastEnd);
}

function printedMinutes(cellXml: string): number | null {
  const match = cellPlainText(cellXml).match(/(\d+)\s*min/i);
  return match ? parseInt(match[1], 10) : null;
}

function minutesFromTimeLabel(time: string): number {
  const match = time.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function formatMinutes(minutes: number): string {
  return `${minutes} min`;
}

function defaultMinutesForKind(kind: NonNullable<ReturnType<typeof activityPhaseKind>>): number {
  if (kind === 'hook' || kind === 'plenary') return 5;
  return 10;
}

function phaseResourceLabel(kind: NonNullable<ReturnType<typeof activityPhaseKind>>): string {
  if (kind === 'hook') return 'Do Now';
  if (kind === 'activation') return 'Activation';
  if (kind === 'demonstration') return 'Demonstration of Learning';
  return 'Consolidation / Review';
}

function allocatePhaseTimes(
  phases: Array<{
    kind: NonNullable<ReturnType<typeof activityPhaseKind>>;
    parsedTime: string;
    printed: number | null;
  }>,
  durationMinutes: number,
): Map<NonNullable<ReturnType<typeof activityPhaseKind>>, { time: string; keepPrinted: boolean }> {
  const result = new Map<
    NonNullable<ReturnType<typeof activityPhaseKind>>,
    { time: string; keepPrinted: boolean }
  >();
  const unlocked: Array<{ kind: NonNullable<ReturnType<typeof activityPhaseKind>>; minutes: number }> =
    [];
  let lockedSum = 0;
  let lockedCount = 0;

  for (const phase of phases) {
    if (phase.printed != null) {
      lockedSum += phase.printed;
      lockedCount += 1;
      result.set(phase.kind, { time: formatMinutes(phase.printed), keepPrinted: true });
      continue;
    }
    const parsed = minutesFromTimeLabel(phase.parsedTime);
    unlocked.push({
      kind: phase.kind,
      minutes: parsed || defaultMinutesForKind(phase.kind),
    });
  }

  const shouldFitDuration =
    lockedCount > 0 && phases.length >= 4 && durationMinutes > 0 && unlocked.length > 0;
  if (shouldFitDuration) {
    const remaining = Math.max(unlocked.length, durationMinutes - lockedSum);
    const bookends = unlocked.filter((item) => item.kind === 'hook' || item.kind === 'plenary');
    const middle = unlocked.filter((item) => item.kind !== 'hook' && item.kind !== 'plenary');
    let used = 0;
    for (const item of bookends) {
      item.minutes = Math.max(1, Math.min(item.minutes || 5, remaining - used - middle.length));
      used += item.minutes;
    }
    if (middle.length === 1) {
      middle[0].minutes = Math.max(1, remaining - used);
    } else if (middle.length > 1) {
      const leftover = remaining - used;
      const sourceSum = middle.reduce((sum, item) => sum + item.minutes, 0) || middle.length;
      let assigned = 0;
      middle.forEach((item, index) => {
        if (index === middle.length - 1) {
          item.minutes = Math.max(1, leftover - assigned);
        } else {
          item.minutes = Math.max(1, Math.round((item.minutes / sourceSum) * leftover));
          assigned += item.minutes;
        }
      });
    }
  }

  for (const item of unlocked) {
    result.set(item.kind, { time: formatMinutes(item.minutes), keepPrinted: false });
  }
  return result;
}

function findMergedColumn(cellsByRow: string[][]): number | null {
  for (const cells of cellsByRow) {
    for (let index = 0; index < cells.length; index += 1) {
      if (vMergeKind(cells[index]) === 'restart') return index;
    }
  }
  return null;
}

function senTargetedItems(_content: LessonPlan['content']): string[] {
  return [
    'SEN/LS: targeted access arrangements and in-lesson intervention for identified learners.',
    'G&T: targeted enrichment that increases depth of thinking, not extra volume.',
  ];
}

function withoutICanColonPrefix(text: string): string {
  return text.replace(/\bI can:\s*/gi, 'I can ');
}

function asCompleteSentence(text: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  const capitalized = `${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}`;
  if (/[.!?]$/.test(capitalized)) return capitalized;
  return `${capitalized}.`;
}

function asICanSentence(text: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'I can complete the core task with support.';
  if (/^i can\b/i.test(cleaned)) return asCompleteSentence(cleaned);
  return asCompleteSentence(`I can ${cleaned.replace(/^[:.\s]+/, '')}`);
}

function activationDifferentiationLine(): string {
  return 'Support with a model or prompts; stretch with a further example. See Adaptive Teaching.';
}

function activityLevelLine(level: 1 | 2 | 3, content: LessonPlan['content']): string {
  const slots = content.templateSlots;
  if (level === 1 && slots?.activitySupported) return asCompleteSentence(slots.activitySupported);
  if (level === 2 && slots?.activityExpected) return asCompleteSentence(slots.activityExpected);
  if (level === 3 && slots?.activityStretch) return asCompleteSentence(slots.activityStretch);
  if (level === 1) return 'See Adaptive Teaching: Working Towards Mastery.';
  if (level === 2) return 'See Adaptive Teaching: Working At Mastery.';
  return 'See Adaptive Teaching: Mastery with Greater Depth.';
}

function scaledICan(
  scale: 'support' | 'extend',
  content: LessonPlan['content'],
): string {
  if (scale === 'support' && content.templateSlots?.successCriteriaSupported) {
    return asICanSentence(content.templateSlots.successCriteriaSupported);
  }
  if (scale === 'extend' && content.templateSlots?.successCriteriaExtended) {
    return asICanSentence(content.templateSlots.successCriteriaExtended);
  }
  if (scale === 'support') return 'I can complete the core task with support.';
  return 'I can extend the core task independently.';
}

function homeworkLevelLine(
  band: 'towards' | 'at' | 'depth' | 'extension',
  content: LessonPlan['content'],
): string {
  const slots = content.templateSlots;
  if (band === 'towards' && slots?.homeworkSupported) return asCompleteSentence(slots.homeworkSupported);
  if (band === 'at' && slots?.homeworkExpected) return asCompleteSentence(slots.homeworkExpected);
  if (band === 'depth' && slots?.homeworkStretch) return asCompleteSentence(slots.homeworkStretch);
  if (band === 'extension' && slots?.homeworkExtension) return asCompleteSentence(slots.homeworkExtension);
  if (band === 'towards') return 'Complete the independent practice task at your level with support.';
  if (band === 'at') return 'Complete the independent practice task at your level.';
  if (band === 'depth') return 'Complete the independent practice task at your level with greater depth.';
  return 'Complete the independent practice task at your level as an extension.';
}

function matchesTowardsLabel(label: string): boolean {
  const text = normalizeLabel(label);
  return text.includes('working towards mastery') || /^\[1\]/.test(label.trim());
}

function matchesGreaterDepthLabel(label: string): boolean {
  return /greater depth/i.test(label);
}

function matchesExtensionLabel(label: string): boolean {
  return normalizeLabel(label) === 'extension';
}

function fillActivityPhaseRow(
  cellsXml: string[],
  parsed: ParsedActivityFields,
  content: LessonPlan['content'],
  options?: {
    allocatedTime?: string;
    keepPrintedTime?: boolean;
    skipResources?: boolean;
    resourcesOverride?: string;
  },
): string[] {
  const formativePool = content.formativeAssessment ?? [];
  const time = (options?.allocatedTime ?? parsed.time).trim();
  const teacher = parsed.teacher.trim();
  const learner = withoutICanColonPrefix(
    parsed.learner.trim() || formatICanStatements(content.successCriteria) || '',
  );
  const assessment = parsed.assessment.trim() || formativePool[0] || '';
  const resources = (options?.resourcesOverride ?? (parsed.resources.trim() || DEFAULT_RESOURCES)).trim();
  const successCriteriaItems = (content.successCriteria ?? []).map((item) => item.trim()).filter(Boolean);
  const iCan = withoutICanColonPrefix(
    successCriteriaItems.some((item) => /\bi can\b/i.test(item))
      ? joinBullets(successCriteriaItems)
      : formatICanStatements(successCriteriaItems),
  );
  const activitiesCell = /differentiated activities/i.test(cellPlainText(cellsXml[1] ?? ''));
  const successCriteriaCell = /differentiated success criteria/i.test(cellPlainText(cellsXml[2] ?? ''));
  const homeworkCell = /homework differentiation/i.test(cellPlainText(cellsXml[2] ?? ''));

  const next = [...cellsXml];
  if (!options?.keepPrintedTime && time) next[0] = replaceCellParagraphs(next[0], time);
  if (teacher) {
    next[1] = fillStructuredCell(next[1], teacher, [
      { match: (label) => /class discussion/i.test(label), content: teacher },
      { match: (label) => activitiesCell && matchesTowardsLabel(label), content: activityLevelLine(1, content) },
      { match: (label) => activitiesCell && matchesAtMasteryLabel(label), content: activityLevelLine(2, content) },
      { match: (label) => activitiesCell && matchesGreaterDepthLabel(label), content: activityLevelLine(3, content) },
    ]);
  }
  if (learner) {
    next[2] = fillStructuredCell(next[2], learner, [
      { match: (label) => /student participation/i.test(label), content: learner },
      { match: (label) => /student-centered approach/i.test(label), content: learner },
      {
        match: (label) => normalizeLabel(label) === 'differentiation',
        content: activationDifferentiationLine(),
      },
      { match: (label) => /^plenary\b/i.test(label.trim()), content: learner },
      {
        match: (label) => successCriteriaCell && matchesTowardsLabel(label),
        content: scaledICan('support', content),
      },
      {
        match: (label) => successCriteriaCell && matchesAtMasteryLabel(label),
        content: iCan,
      },
      {
        match: (label) => successCriteriaCell && matchesGreaterDepthLabel(label),
        content: scaledICan('extend', content),
      },
      {
        match: (label) => homeworkCell && matchesTowardsLabel(label),
        content: homeworkLevelLine('towards', content),
      },
      {
        match: (label) => homeworkCell && matchesAtMasteryLabel(label),
        content: homeworkLevelLine('at', content),
      },
      {
        match: (label) => homeworkCell && matchesGreaterDepthLabel(label),
        content: homeworkLevelLine('depth', content),
      },
      {
        match: (label) => homeworkCell && matchesExtensionLabel(label),
        content: homeworkLevelLine('extension', content),
      },
    ]);
  }
  if (assessment) {
    next[3] = fillStructuredCell(next[3], assessment, [
      { match: (label) => /formal introduction/i.test(label), content: assessment },
      { match: (label) => /formative data/i.test(label), content: assessment },
    ]);
  }
  if (!options?.skipResources && resources) next[4] = replaceCellParagraphs(next[4], resources);
  return next;
}

type ActivityPhaseFill = {
  index: number;
  kind: NonNullable<ReturnType<typeof activityPhaseKind>>;
  label: string;
  parsed: ParsedActivityFields;
  cellMatches: XmlSegment[];
  cellsXml: string[];
};

function collectActivityPhases(rowMatches: XmlSegment[], content: LessonPlan['content']): ActivityPhaseFill[] {
  const phases: ActivityPhaseFill[] = [];
  rowMatches.forEach((row, index) => {
    const cellMatches = topLevelWordTags(row.xml, 'w:tc');
    const cellsXml = cellMatches.map((cell) => cell.xml);
    if (!isActivityTableRow(cellsXml) || isActivityHeaderRow(cellsXml) || isActivityInstructionRow(cellsXml)) {
      return;
    }
    const kind = activityPhaseKind(cellsXml[1] ?? '');
    if (!kind) return;
    const source = activitySourceForPhase(kind, content);
    if (!source) return;
    const parsed = mergeParsedActivities(source.items, source.fallbackTime);
    if (!parsed) return;
    phases.push({ index, kind, label: source.label, parsed, cellMatches, cellsXml });
  });
  return phases;
}

function fillActivityPhasesInTable(
  tblXml: string,
  lesson: LessonPlan,
): { xml: string; filledCount: number; labels: string[] } {
  const rowMatches = topLevelWordTags(tblXml, 'w:tr');
  const phases = collectActivityPhases(rowMatches, lesson.content);
  if (phases.length === 0) return { xml: tblXml, filledCount: 0, labels: [] };

  const allocated = allocatePhaseTimes(
    phases.map((phase) => ({
      kind: phase.kind,
      parsedTime: phase.parsed.time,
      printed: printedMinutes(phase.cellsXml[0] ?? ''),
    })),
    lesson.duration_minutes,
  );
  const mergedColumn = findMergedColumn(phases.map((phase) => phase.cellsXml));
  const labelledResources = phases
    .map((phase) => {
      const resources = phase.parsed.resources.trim() || DEFAULT_RESOURCES;
      return `${phaseResourceLabel(phase.kind)}:\n${resources}`;
    })
    .join('\n\n');

  const filledRows = new Map<number, string>();
  for (const phase of phases) {
    const timing = allocated.get(phase.kind);
    const column = mergedColumn ?? 4;
    const merge = vMergeKind(phase.cellsXml[column] ?? '');
    const next = fillActivityPhaseRow(phase.cellsXml, phase.parsed, lesson.content, {
      allocatedTime: timing?.time,
      keepPrintedTime: timing?.keepPrinted ?? false,
      skipResources: mergedColumn != null && merge === 'continue',
      resourcesOverride: mergedColumn != null && merge === 'restart' ? labelledResources : undefined,
    });
    filledRows.set(phase.index, rebuildRow(rowMatches[phase.index].xml, phase.cellMatches, next));
  }

  let result = '';
  let lastEnd = 0;
  rowMatches.forEach((row, index) => {
    result += tblXml.slice(lastEnd, row.index) + (filledRows.get(index) ?? row.xml);
    lastEnd = row.index + row.xml.length;
  });
  return {
    xml: result + tblXml.slice(lastEnd),
    filledCount: phases.length,
    labels: phases.map((phase) => phase.label),
  };
}

function isAdaptiveHeadingCell(cellXml: string): boolean {
  const text = normalizeLabel(cellPlainText(cellXml));
  return text.includes('working towards mastery') && (text.includes('prior knowledge') || text.includes('greater depth'));
}

function isAdaptiveLabelCell(cellXml: string): boolean {
  const label = normalizeLabel(cellPlainText(cellXml).split('\n')[0] ?? '');
  return (
    label.includes('adaptive teaching') ||
    label === 'differentiation' ||
    label === 'differentiated instruction'
  );
}

function normalizeCompareText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitWrittenLines(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.replace(/^[•\s]+/, '').trim())
    .filter(Boolean);
}

function isNearDuplicate(item: string, existing: string[]): boolean {
  const left = normalizeCompareText(item);
  if (left.length < 8) return false;
  return existing.some((other) => {
    const right = normalizeCompareText(other);
    if (right.length < 8) return false;
    return left === right || left.includes(right) || right.includes(left);
  });
}

function practiceCellWrittenTexts(content: LessonPlan['content']): string[] {
  const source = activitySourceForPhase('demonstration', content);
  const parsed = source ? mergeParsedActivities(source.items, source.fallbackTime) : null;
  const successCriteriaItems = (content.successCriteria ?? []).map((item) => item.trim()).filter(Boolean);
  const iCan = withoutICanColonPrefix(
    successCriteriaItems.some((item) => /\bi can\b/i.test(item))
      ? joinBullets(successCriteriaItems)
      : formatICanStatements(successCriteriaItems),
  );
  return [
    parsed?.teacher ?? '',
    parsed?.learner ? withoutICanColonPrefix(parsed.learner) : '',
    activityLevelLine(1, content),
    activityLevelLine(2, content),
    activityLevelLine(3, content),
    scaledICan('support', content),
    iCan,
    scaledICan('extend', content),
  ].flatMap(splitWrittenLines);
}

function adaptivePointerForHeading(heading: string): string {
  const text = normalizeLabel(heading);
  if (text.includes('working towards mastery')) return 'See Adaptive Teaching: Working Towards Mastery.';
  if (text.includes('working at mastery')) return 'See Adaptive Teaching: Working At Mastery.';
  if (text.includes('greater depth')) return 'See Adaptive Teaching: Mastery with Greater Depth.';
  return 'See Adaptive Teaching.';
}

function dedupeAdaptiveItems(items: string[], practiceTexts: string[], pointer: string): string[] {
  const unique = items.filter((item) => !isNearDuplicate(item, practiceTexts));
  return unique.length > 0 ? unique : [pointer];
}

function adaptiveHeadingItems(heading: string, content: LessonPlan['content']): string[] {
  const text = normalizeLabel(heading);
  if (text.startsWith('prior knowledge')) {
    if (text.includes('working towards') || text.includes('greater depth')) return [];
    return content.priorKnowledge ?? [];
  }
  if (text.includes('working towards mastery')) return content.differentiation?.support ?? [];
  if (text.includes('working at mastery')) {
    const strategy = content.templateSlots?.activityExpected?.trim();
    if (strategy) return [asCompleteSentence(strategy)];
    return ['See Adaptive Teaching: Working At Mastery.'];
  }
  if (text.includes('greater depth')) return content.differentiation?.extension ?? [];
  if (text.includes('other adaptive')) return inferTeachingStrategies(content);
  if (text.includes('sen') || text.includes('learning support') || text.includes('gifted')) {
    return senTargetedItems(content);
  }
  return [];
}

function fillAdaptiveHeadingCell(cellXml: string, content: LessonPlan['content']): string {
  const paras = topLevelWordTags(cellXml, 'w:p');
  if (paras.length === 0) return cellXml;
  const practiceTexts = practiceCellWrittenTexts(content);

  const insertions: Array<{ afterIndex: number; xml: string }> = [];
  paras.forEach((para, index) => {
    const heading = cellPlainText(para.xml);
    if (!heading) return;
    const items = dedupeAdaptiveItems(
      adaptiveHeadingItems(heading, content),
      practiceTexts,
      adaptivePointerForHeading(heading),
    );
    if (items.length === 0) return;
    const bullets = items.map((item) => `• ${item}`).join('\n');
    insertions.push({ afterIndex: index, xml: buildParagraphsXml(para.xml, bullets) });
  });
  if (insertions.length === 0) return cellXml;

  const insertionByIndex = new Map<number, string>();
  for (const insertion of insertions) {
    insertionByIndex.set(insertion.afterIndex, insertion.xml);
  }

  let result = '';
  let lastEnd = 0;
  paras.forEach((para, index) => {
    result += cellXml.slice(lastEnd, para.index) + para.xml;
    const extra = insertionByIndex.get(index);
    if (extra) result += extra;
    lastEnd = para.index + para.xml.length;
  });
  return result + cellXml.slice(lastEnd);
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

function stripLeadingListMarker(item: string): string {
  return item.replace(/^(?:[*\u2022\u2013\u2014-][ \t]+)+/, '');
}

function joinBullets(items: string[] | undefined): string {
  if (!items?.length) return '';
  return items.map((item) => `• ${stripLeadingListMarker(item)}`).join('\n');
}

/**
 * Like joinBullets, but separates each item with a blank line so multi-line
 * activity blocks (each with its own Time/Teacher/Learner/Resources sub-lines)
 * don't visually run into one another once rendered as paragraphs.
 */
function joinBlocks(items: string[] | undefined): string {
  if (!items?.length) return '';
  return items.map((item) => `• ${stripLeadingListMarker(item)}`).join('\n\n');
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

  const inheritsNumPr = /<w:numPr\b/.test(pPrXml);

  return text
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        // A blank line that keeps list numbering renders as an empty bullet.
        return inheritsNumPr ? '' : `<w:p>${pPrXml}</w:p>`;
      }
      const isBoldLine = trimmed.startsWith('>>');
      let content = isBoldLine ? trimmed.slice(2).trim() : trimmed;
      if (inheritsNumPr) {
        content = content.replace(/^[•\-*]\s*/, '');
      }
      if (!content) return inheritsNumPr ? '' : `<w:p>${pPrXml}</w:p>`;
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

function isCheckboxGridCell(cellXml: string): boolean {
  return cellXml.includes('w14:checkbox') || cellXml.includes('\u2610') || isCheckboxValueCell(cellXml);
}

function setSdtCheckboxChecked(sdtXml: string): string {
  return sdtXml
    .replace(/<w14:checked w14:val="0"\s*\/>/g, '<w14:checked w14:val="1"/>')
    .replace(/\u2610/g, '\u2612');
}

function checkParagraphIfSelected(
  pXml: string,
  selections: string[],
): { xml: string; checked: boolean } {
  const text = cellPlainText(pXml)
    .replace(/[\u2610\u2611\u2612]/g, '')
    .trim();
  if (
    !text ||
    /^please highlight/i.test(text) ||
    /^if [‘'"]other/i.test(text) ||
    /^intended purpose/i.test(text) ||
    /^purposeful use/i.test(text) ||
    /^is a digital tool required/i.test(text)
  ) {
    return { xml: pXml, checked: false };
  }
  const hasBox = pXml.includes('w14:checkbox') || pXml.includes('\u2610');
  if (!hasBox || !optionIsSelected(text, selections)) {
    return { xml: pXml, checked: false };
  }

  let xml = pXml;
  if (xml.includes('<w:sdt>')) {
    xml = replaceTopLevelWordTags(xml, 'w:sdt', (sdt) =>
      sdt.includes('w14:checkbox') ? setSdtCheckboxChecked(sdt) : sdt,
    );
  }
  xml = xml.replace(/\u2610/g, '\u2612');
  return { xml, checked: true };
}

function fillCheckboxGridCell(
  cellXml: string,
  selections: string[],
): { xml: string; checkedCount: number } {
  if (selections.length === 0) return { xml: cellXml, checkedCount: 0 };

  const hasStructuredBoxes = cellXml.includes('w14:checkbox') || cellXml.includes('\u2610');
  if (hasStructuredBoxes) {
    let checkedCount = 0;
    let xml = replaceTopLevelWordTags(cellXml, 'w:p', (pXml) => {
      const result = checkParagraphIfSelected(pXml, selections);
      if (result.checked) checkedCount += 1;
      return result.xml;
    });
    if (/is a digital tool required/i.test(cellPlainText(cellXml))) {
      xml = xml.replace(/Yes \/ No/g, 'Yes');
    }
    return { xml, checkedCount };
  }

  if (isCheckboxValueCell(cellXml)) {
    return { xml: highlightCheckboxCell(cellXml, selections), checkedCount: 1 };
  }
  return { xml: cellXml, checkedCount: 0 };
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

function matchTargetedLearningSkills(lesson: LessonPlan): string[] {
  const blob = lessonTextBlob(lesson);
  const matched: string[] = [];
  if (/collaborat|communication|pair|group|interact/.test(blob)) {
    matched.push('Interactions, collaboration and communication skills');
  }
  if (/critical|analy|evaluat/.test(blob)) matched.push('Critical Thinking');
  if (/problem|solve|design/.test(blob)) matched.push('Problem Solving');
  if (/technolog|digital|projector|phet|whiteboard/.test(blob)) {
    matched.push('Use of learning technologies');
  }
  if (/connect/.test(blob)) matched.push('Making connections between areas of learning');
  if (/real world|world around|application/.test(blob)) {
    matched.push('Application of learning to the world');
  }
  if (/research|enquir|investigat/.test(blob)) matched.push('Enquiry/Research');
  if (matched.length > 0) return [...new Set(matched)];
  return ['Critical Thinking', 'Making connections between areas of learning'];
}

function matchFormativeAssessmentMethods(lesson: LessonPlan): string[] {
  const haystack = lessonTextBlob(lesson);
  const matched: string[] = [];
  if (/think\s*\/\s*pair|pair share|think.pair/.test(haystack)) matched.push('Think/Pair/Share');
  if (/self-eval|self eval/.test(haystack)) matched.push('Student Self-evaluation');
  if (/peer/.test(haystack)) matched.push('Peer-assessment');
  if (/verbal|oral feedback/.test(haystack)) matched.push('Verbal Feedback');
  if (/written feedback/.test(haystack)) matched.push('Written Feedback');
  if (/\bquiz/.test(haystack)) matched.push('Quiz');
  if (/journal/.test(haystack)) matched.push('Learning Journals');
  if (/reflection log/.test(haystack)) matched.push('Reflection Logs');
  if (/exit ticket/.test(haystack)) matched.push('Exit Tickets');
  if (/traffic light/.test(haystack)) matched.push('Traffic Light Cards');
  if (/observ/.test(haystack)) matched.push('Observations');
  if (matched.length > 0) return matched;
  return ['Exit Tickets', 'Verbal Feedback'];
}

function lessonUsesDigitalTools(lesson: LessonPlan): boolean {
  return /projector|phet|digital|chromebook|tablet|platform|online|simulation|kahoot|quizlet|powerpoint|slides|video|interactive|whiteboard|computer/.test(
    lessonTextBlob(lesson),
  );
}

function matchDigitalPedagogy(lesson: LessonPlan): string[] {
  if (!lessonUsesDigitalTools(lesson)) return [];
  return [
    'Increase engagement and active participation',
    'Clearly linked to the lesson objective',
    'Integrated into the activity',
  ];
}

function matchInnovationSelections(lesson: LessonPlan): string[] {
  const extra: string[] = [];
  const blob = lessonTextBlob(lesson);
  if (/technolog|digital|projector|whiteboard/.test(blob)) extra.push('Use of learning technologies');
  if (/creat|innovat|design/.test(blob)) extra.push('Creativity and innovation');
  if (/\bai\b/.test(blob)) extra.push('AI');
  return [...new Set([...matchTwentyFirstCenturySelections(lesson), ...extra])];
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

function checkboxLabelsMatch(cellLabel: string, candidate: string): boolean {
  const a = cellLabel;
  const b = normalizeLabel(candidate);
  if (a === b) return true;
  if (b.length >= 12 && a.includes(b)) return true;
  if (a.length >= 12 && b.includes(a)) return true;
  return false;
}

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
    labels: [
      'Higher-Order Thinking Focus',
      'Higher Order Thinking Focus',
      'Higher-Order Thinking',
      'Higher Order Thinking Skills',
    ],
    getSelections: (lesson) => inferHigherOrderThinking(lesson.content.objectives),
  },
  {
    labels: [
      'Innovation / 21st Century Skills / Global Competencies',
      '21st Century Skills / Global Competencies',
      '21st Century Skills',
      'Global Competencies',
    ],
    getSelections: matchInnovationSelections,
  },
  {
    labels: ['Cross-Curricular Connections', 'Cross Curricular Links'],
    getSelections: matchCrossCurricularSelections,
  },
  {
    labels: ['Targeted Learning Skills'],
    getSelections: matchTargetedLearningSkills,
  },
  {
    labels: ['Teaching Strategies'],
    getSelections: (lesson) => inferTeachingStrategies(lesson.content),
  },
  {
    labels: ['Formative Assessment Methods'],
    getSelections: matchFormativeAssessmentMethods,
  },
  {
    labels: ['Digital Pedagogy & Tool Integration', 'Digital Pedagogy'],
    getSelections: matchDigitalPedagogy,
  },
  {
    labels: ['Seating Arrangements'],
    getSelections: matchSeatingSelections,
  },
];

function getCheckboxSelections(label: string, lesson: LessonPlan): string[] | null {
  const config = CHECKBOX_FIELDS.find((field) =>
    field.labels.some((candidate) => checkboxLabelsMatch(label, candidate)),
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
  set(['Grade', 'Grade Level', 'Class', 'Year Group', 'Grade/Class'], formatGradeLabel(lesson.grade, tEn));
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
  formFieldCount?: number;
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

  const newXml = replaceTopLevelWordTags(xml, 'w:tbl', (tblMatch) => {
    const withLabels = replaceTopLevelWordTags(tblMatch, 'w:tr', (rowMatch) => {
      const cellMatches = topLevelWordTags(rowMatch, 'w:tc');
      if (cellMatches.length < 1) return rowMatch;

      const cellsXml = cellMatches.map((m) => m.xml);

      if (isActivityTableRow(cellsXml)) {
        return rowMatch;
      }

      let changed = false;

      for (let i = 0; i < cellsXml.length; i++) {
        const valueCell = cellsXml[i + 1];

        if (isAdaptiveLabelCell(cellsXml[i]) && valueCell && isAdaptiveHeadingCell(valueCell)) {
          cellsXml[i + 1] = fillAdaptiveHeadingCell(valueCell, lesson.content);
          changed = true;
          filledCount += 1;
          matchedLabels.push('adaptive teaching / differentiation');
          continue;
        }

        const checkboxSelections = getCheckboxSelectionsForCell(cellsXml[i], lesson);
        if (checkboxSelections && valueCell && isCheckboxGridCell(valueCell)) {
          const filled = fillCheckboxGridCell(valueCell, checkboxSelections);
          cellsXml[i + 1] = filled.xml;
          changed = true;
          filledCount += 1;
          matchedLabels.push(labelCandidatesFromCell(cellsXml[i])[0] ?? '');
          continue;
        }

        if (isAdaptiveHeadingCell(cellsXml[i])) continue;

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
      return rebuildRow(rowMatch, cellMatches, cellsXml);
    });

    const phases = fillActivityPhasesInTable(withLabels, lesson);
    filledCount += phases.filledCount;
    matchedLabels.push(...phases.labels);
    return phases.xml;
  });

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
