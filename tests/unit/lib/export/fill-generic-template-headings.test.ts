import { readFileSync } from 'fs';
import { join } from 'path';
import { TextEncoder, TextDecoder } from 'util';
import JSZip from 'jszip';
import { cellPlainText, fillGenericDocxTemplate } from '@/lib/export/fill-generic-template';
import type { LessonPlan } from '@/types';

Object.assign(globalThis, { TextEncoder, TextDecoder });

/**
 * DO NOT REMOVE blank-daily-english-lesson-plan.docx. It is byte-identical to the
 * tester's real blank template, where every affected heading is a bulleted list
 * paragraph. PR #29 deleted it, the synthetic fixture did not reproduce the bug,
 * and the bulleted headings slipped through. Every case here runs on both files.
 */
const FIXTURES = [
  ['real tester template (blank-daily-english-lesson-plan.docx)', 'blank-daily-english-lesson-plan.docx'],
  ['synthetic template (synthetic-daily-english-lesson-plan.docx)', 'synthetic-daily-english-lesson-plan.docx'],
] as const;

const lesson = {
  id: 'heading-bullets',
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
    priorKnowledge: ['PRIOR_A basic conservation vocabulary', 'PRIOR_B simple present tense'],
    misconceptions: ['MISCONCEPTION_MARKER'],
    keyConcepts: ['Modal verbs express obligation'],
    vocabulary: ['must', 'have to'],
    hook: 'Time: 5 min\nTeacher Activity: hook\nLearner Activity & Success Criteria: watch\nResources: video',
    mainActivities: [],
    guidedPractice: [],
    independentPractice: [],
    formativeAssessment: ['Exit ticket'],
    differentiation: {
      support: ['SUPPORT_A bilingual glossary', 'SUPPORT_B sentence frames'],
      extension: ['EXTENSION_A debate the subtle differences'],
    },
    realWorldConnections: [],
    plenary: 'Time: 5 min',
    templateSlots: {
      activitySupported: 'Work with a teacher model and guided prompts to complete the task.',
      activityExpected: 'Complete the core task independently.',
      activityStretch: 'Extend the task by analysing a further example.',
      successCriteriaSupported: 'I can complete the task with a model and prompts.',
      successCriteriaExtended: 'I can apply this concept to a new scenario.',
      homeworkSupported: 'HW_TOWARDS review your sentences at home.',
      homeworkExpected: 'HW_AT write a short paragraph at home.',
      homeworkStretch: 'HW_DEPTH research an organisation at home.',
      homeworkExtension: 'HW_EXT create a digital presentation at home.',
    },
  },
} as unknown as LessonPlan;

type Para = { xml: string; text: string };

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

function paragraphs(cellXml: string): Para[] {
  return topLevel(cellXml, 'w:p').map((xml) => ({ xml, text: cellPlainText(xml).trim() }));
}

function cellContaining(xml: string, ...needles: RegExp[]): string {
  for (const tbl of topLevel(xml, 'w:tbl')) {
    for (const row of topLevel(tbl, 'w:tr')) {
      for (const cell of topLevel(row, 'w:tc')) {
        const text = cellPlainText(cell);
        if (needles.every((re) => re.test(text))) return cell;
      }
    }
  }
  throw new Error(`no cell matches ${needles.map(String).join(', ')}`);
}

async function load(fixture: string) {
  const template = readFileSync(join(__dirname, '../../../fixtures', fixture));
  const result = await fillGenericDocxTemplate(template, lesson);
  const outZip = await JSZip.loadAsync(result.buffer);
  const inZip = await JSZip.loadAsync(template);
  return {
    inXml: await inZip.file('word/document.xml')!.async('string'),
    outXml: await outZip.file('word/document.xml')!.async('string'),
    numberingXml: (await outZip.file('word/numbering.xml')?.async('string')) ?? '',
  };
}

const hasNumPr = (p: Para) => /<w:numPr\b/.test(p.xml);
const isBold = (p: Para) => /<w:b\s*\/>/.test(p.xml.replace(/<w:pPr>[\s\S]*?<\/w:pPr>/, ''));
const directIndent = (p: Para) => {
  const pPr = p.xml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/)?.[0] ?? '';
  const ind = pPr.replace(/<w:rPr>[\s\S]*?<\/w:rPr>/, '').match(/<w:ind\b[^>]*>/)?.[0] ?? '';
  return {
    left: Number(ind.match(/w:left="(-?\d+)"/)?.[1] ?? NaN),
    hanging: Number(ind.match(/w:hanging="(\d+)"/)?.[1] ?? 0),
    firstLine: Number(ind.match(/w:firstLine="(\d+)"/)?.[1] ?? 0),
  };
};

function numberingLeft(numberingXml: string, paraXml: string): number {
  const numId = paraXml.match(/<w:numId w:val="(\d+)"/)?.[1];
  const ilvl = paraXml.match(/<w:ilvl w:val="(\d+)"/)?.[1] ?? '0';
  const abstractId = numberingXml.match(
    new RegExp(`<w:num w:numId="${numId}"[^>]*>[\\s\\S]*?<w:abstractNumId w:val="(\\d+)"`),
  )?.[1];
  const abstract = numberingXml.match(
    new RegExp(`<w:abstractNum w:abstractNumId="${abstractId}"[\\s\\S]*?</w:abstractNum>`),
  )?.[0] ?? '';
  const lvl = abstract.match(new RegExp(`<w:lvl w:ilvl="${ilvl}"[\\s\\S]*?</w:lvl>`))?.[0] ?? '';
  return Number(lvl.match(/<w:ind w:left="(\d+)"/)?.[1]);
}

const ADAPTIVE_HEADINGS: Array<[string, RegExp]> = [
  ['Prior knowledge', /^prior knowledge:$/i],
  ['Working Towards Mastery', /^working towards mastery(?: \(all\))?:$/i],
  ['Working At Mastery', /^working at mastery(?: \(most\))?:$/i],
  ['Mastery with Greater Depth', /^mastery with greater depth(?: \(some\))?:$/i],
  ['Other adaptive teaching strategies', /^other adaptive teaching strategies:$/i],
  ['Special Educational Needs', /^special educational needs/i],
];

const HOMEWORK_HEADINGS: Array<[string, RegExp, string]> = [
  ['Working Towards Mastery', /^working towards mastery(?: \(all\))?:$/i, 'HW_TOWARDS'],
  ['Working At Mastery', /^working at mastery(?: \(most\))?:$/i, 'HW_AT'],
  ['Mastery with Greater Depth', /^mastery with greater depth(?: \(some\))?:$/i, 'HW_DEPTH'],
  ['Extension', /^extension:$/i, 'HW_EXT'],
];

/** Points that follow a heading, up to the next heading in the same list. */
function pointsAfter(paras: Para[], index: number, headingRes: RegExp[]): Para[] {
  const points: Para[] = [];
  for (const para of paras.slice(index + 1)) {
    if (headingRes.some((re) => re.test(para.text))) break;
    if (!para.text) continue;
    points.push(para);
  }
  return points;
}

describe.each(FIXTURES)('heading bullets in template fill: %s', (_name, fixture) => {
  const isReal = fixture === 'blank-daily-english-lesson-plan.docx';

  it('turns every adaptive teaching heading into plain bold text with no bullet', async () => {
    const { inXml, outXml, numberingXml } = await load(fixture);
    const cell = cellContaining(outXml, /working towards mastery/i, /prior knowledge/i);
    const inCell = paragraphs(cellContaining(inXml, /working towards mastery/i, /prior knowledge/i));
    const paras = paragraphs(cell);
    const headingRes = ADAPTIVE_HEADINGS.map(([, re]) => re);

    for (const [label, re] of ADAPTIVE_HEADINGS) {
      const original = inCell.find((p) => re.test(p.text));
      const heading = paras.find((p) => re.test(p.text));
      expect({ label, found: Boolean(original && heading) }).toEqual({ label, found: true });
      expect({ label, bulleted: hasNumPr(heading!) }).toEqual({ label, bulleted: false });
      expect({ label, bold: isBold(heading!) }).toEqual({ label, bold: true });
      expect(heading!.text).toBe(original!.text);
      if (hasNumPr(original!)) {
        expect(directIndent(heading!).hanging).toBe(0);
        expect(directIndent(heading!).firstLine).toBe(0);
      }
    }

    for (const [label, re] of ADAPTIVE_HEADINGS) {
      const index = paras.findIndex((p) => re.test(p.text));
      const points = pointsAfter(paras, index, headingRes);
      expect({ label, count: points.length > 0 }).toEqual({ label, count: true });
      for (const point of points) {
        if (isReal) expect(hasNumPr(point)).toBe(true);
        expect(isBold(point)).toBe(false);
        expect(point.text).not.toMatch(/^[•\-*]/);
        expect(point.text.endsWith(':') && point.text.length < 60).toBe(false);
      }
    }

    const priorAt = paras.findIndex((p) => ADAPTIVE_HEADINGS[0][1].test(p.text));
    expect(pointsAfter(paras, priorAt, headingRes).map((p) => p.text)).toEqual([
      'PRIOR_A basic conservation vocabulary',
      'PRIOR_B simple present tense',
    ]);
    const towardsAt = paras.findIndex((p) => ADAPTIVE_HEADINGS[1][1].test(p.text));
    expect(pointsAfter(paras, towardsAt, headingRes).map((p) => p.text.slice(0, 9))).toEqual([
      'SUPPORT_A',
      'SUPPORT_B',
    ]);
    const depthAt = paras.findIndex((p) => ADAPTIVE_HEADINGS[3][1].test(p.text));
    expect(pointsAfter(paras, depthAt, headingRes)[0].text).toMatch(/^EXTENSION_A/);

    const firstPoint = pointsAfter(paras, priorAt, headingRes)[0];
    const heading = paras[priorAt];
    if (isReal) {
      expect(hasNumPr(inCell.find((p) => ADAPTIVE_HEADINGS[0][1].test(p.text))!)).toBe(true);
      expect(directIndent(heading).left).toBe(numberingLeft(numberingXml, firstPoint.xml));
    } else {
      expect(Number.isNaN(directIndent(heading).left)).toBe(true);
      expect(outXml).not.toContain('NaN');
    }
  });

  it('turns the four Homework Differentiation labels into plain bold text with their points kept', async () => {
    const { outXml } = await load(fixture);
    const paras = paragraphs(cellContaining(outXml, /homework differentiation/i));
    const headingRes = HOMEWORK_HEADINGS.map(([, re]) => re);

    for (const [label, re, marker] of HOMEWORK_HEADINGS) {
      const index = paras.findIndex((p) => re.test(p.text));
      expect({ label, found: index >= 0 }).toEqual({ label, found: true });
      const heading = paras[index];
      expect({ label, bulleted: hasNumPr(heading) }).toEqual({ label, bulleted: false });
      expect({ label, bold: isBold(heading) }).toEqual({ label, bold: true });
      expect(heading.text).not.toContain(marker);
      const points = pointsAfter(paras, index, headingRes);
      expect(points).toHaveLength(1);
      expect(points[0].text.startsWith(marker)).toBe(true);
      if (isReal) expect(hasNumPr(points[0])).toBe(true);
      expect(isBold(points[0])).toBe(false);
    }
  });

  it('keeps the heading at the same visual left position as the text of its points', async () => {
    const { inXml, outXml, numberingXml } = await load(fixture);
    const inParas = paragraphs(cellContaining(inXml, /homework differentiation/i));
    const paras = paragraphs(cellContaining(outXml, /homework differentiation/i));
    const headingRes = HOMEWORK_HEADINGS.map(([, re]) => re);
    for (const [, re] of HOMEWORK_HEADINGS) {
      const index = paras.findIndex((p) => re.test(p.text));
      const wasListParagraph = hasNumPr(inParas.find((p) => re.test(p.text))!);
      expect(wasListParagraph).toBe(isReal);
      if (!isReal) {
        expect(Number.isNaN(directIndent(paras[index]).left)).toBe(true);
        continue;
      }
      const point = pointsAfter(paras, index, headingRes)[0];
      const left = directIndent(paras[index]).left;
      expect(left).toBe(numberingLeft(numberingXml, point.xml));
      expect(left).toBe(360);
    }
  });

  it('leaves the plain numbered [1] [2] [3] labels untouched', async () => {
    const { inXml, outXml } = await load(fixture);
    const pick = (xml: string) =>
      topLevel(xml, 'w:p').filter((p) => /^\[\d\]/.test(cellPlainText(p).trim()));
    const before = pick(inXml);
    const after = pick(outXml);
    expect(before.length).toBeGreaterThanOrEqual(6);
    expect(after.length).toBeGreaterThanOrEqual(before.length);
    for (const p of before) {
      expect(/<w:numPr\b/.test(p)).toBe(false);
      expect(after).toContain(p);
    }
  });

  it('writes no w:ind at all when the template list level has no indent', async () => {
    const { inXml, outXml } = await load(fixture);
    expect(outXml).not.toContain('NaN');
    expect(outXml).not.toMatch(/w:(?:left|hanging)="(?:NaN|undefined|null)?"/);
    if (isReal) return;
    const inCell = paragraphs(cellContaining(inXml, /working towards mastery/i, /prior knowledge/i));
    const original = inCell.find((p) => ADAPTIVE_HEADINGS[0][1].test(p.text))!;
    expect(hasNumPr(original)).toBe(true);
    const heading = paragraphs(cellContaining(outXml, /working towards mastery/i, /prior knowledge/i)).find((p) =>
      ADAPTIVE_HEADINGS[0][1].test(p.text),
    )!;
    expect(heading.xml.replace(/<w:rPr>[\s\S]*?<\/w:rPr>/g, '')).not.toContain('<w:ind');
  });

  it('never alters the lesson title', async () => {
    const { outXml } = await load(fixture);
    const withNumPr = topLevel(outXml, 'w:p').filter((p) => /<w:numPr\b/.test(p));
    expect(withNumPr.every((p) => !cellPlainText(p).includes('Ocean conservation: modal verbs'))).toBe(true);
  });
});
