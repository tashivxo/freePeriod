import { readFileSync } from 'fs';
import { join } from 'path';
import { TextEncoder, TextDecoder } from 'util';
import JSZip from 'jszip';
import { cellPlainText, fillGenericDocxTemplate } from '@/lib/export/fill-generic-template';
import type { LessonPlan } from '@/types';
import {
  REAL_EXTENSION,
  REAL_SUPPORT,
  SELF_POINTER_AT,
  SELF_POINTER_DEPTH,
  SELF_POINTER_TOWARDS,
  lessonWithSelfPointerStrategy,
  selfReferentialLesson,
} from '@/tests/helpers/adaptive-self-reference';

Object.assign(globalThis, { TextEncoder, TextDecoder });

/**
 * DO NOT REMOVE blank-daily-english-lesson-plan.docx. It is the tester's real
 * blank template. Every case here runs on it and on the synthetic copy.
 */
const FIXTURES = [
  ['real tester template (blank-daily-english-lesson-plan.docx)', 'blank-daily-english-lesson-plan.docx'],
  ['synthetic template (synthetic-daily-english-lesson-plan.docx)', 'synthetic-daily-english-lesson-plan.docx'],
] as const;

const STRATEGY = 'Keep expected-level writers on a modelled sentence frame and circulate with prompts.';

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

async function fill(fixture: string, lesson: LessonPlan): Promise<string> {
  const template = readFileSync(join(__dirname, '../../../fixtures', fixture));
  const result = await fillGenericDocxTemplate(template, lesson);
  const zip = await JSZip.loadAsync(result.buffer);
  return zip.file('word/document.xml')!.async('string');
}

type AdaptiveBands = { towards: string[]; at: string[]; depth: string[]; all: string };

function adaptiveBands(outXml: string): AdaptiveBands {
  const text = cellPlainText(cellContaining(outXml, /working towards mastery/i, /prior knowledge/i));
  const lines = text
    .split('\n')
    .map((line) => line.replace(/^[•\s]+/, '').trim())
    .filter(Boolean);
  const bands: AdaptiveBands = { towards: [], at: [], depth: [], all: text };
  let current: keyof Omit<AdaptiveBands, 'all'> | null = null;
  for (const line of lines) {
    if (/^working towards mastery/i.test(line)) current = 'towards';
    else if (/^working at mastery/i.test(line)) current = 'at';
    else if (/^mastery with greater depth/i.test(line)) current = 'depth';
    else if (/^(other adaptive|special educational|prior knowledge)/i.test(line)) current = null;
    else if (current) bands[current].push(line);
  }
  return bands;
}

function textOutsideAdaptiveCell(outXml: string): string {
  const adaptive = cellContaining(outXml, /working towards mastery/i, /prior knowledge/i);
  return cellPlainText(outXml.replace(adaptive, ''));
}

describe.each(FIXTURES)('adaptive self references in template fill: %s', (_name, fixture) => {
  it('leaves Working At Mastery without its own pointer when the lesson has no strategy', async () => {
    const bands = adaptiveBands(await fill(fixture, selfReferentialLesson));

    expect(bands.at).toEqual([]);
    expect(bands.all).toMatch(/working at mastery/i);
    expect(bands.all).not.toContain(SELF_POINTER_AT);
    expect(bands.all).not.toContain('\u2014');
  });

  it('never lets Working Towards Mastery or Mastery with Greater Depth point at themselves', async () => {
    const bands = adaptiveBands(await fill(fixture, selfReferentialLesson));

    expect(bands.towards).toEqual([REAL_SUPPORT]);
    expect(bands.depth).toEqual([REAL_EXTENSION]);
    expect(bands.all).not.toContain(SELF_POINTER_TOWARDS);
    expect(bands.all).not.toContain(SELF_POINTER_DEPTH);
  });

  it('drops a model-written self pointer used as the expected strategy', async () => {
    const bands = adaptiveBands(await fill(fixture, lessonWithSelfPointerStrategy(SELF_POINTER_AT)));

    expect(bands.at).toEqual([]);
    expect(bands.all).not.toContain(SELF_POINTER_AT);
  });

  it('uses a real activityExpected strategy under Working At Mastery', async () => {
    const bands = adaptiveBands(await fill(fixture, lessonWithSelfPointerStrategy(STRATEGY)));

    expect(bands.at).toEqual([STRATEGY]);
    expect(bands.all).not.toContain('See Adaptive Teaching');
  });

  it('still lets Practice and Activation cells point at Adaptive Teaching', async () => {
    const outXml = await fill(fixture, selfReferentialLesson);
    const elsewhere = textOutsideAdaptiveCell(outXml);

    expect(elsewhere).toContain(SELF_POINTER_TOWARDS);
    expect(elsewhere).toContain(SELF_POINTER_AT);
    expect(elsewhere).toContain(SELF_POINTER_DEPTH);
    expect(elsewhere).toMatch(/See Adaptive Teaching\.(?!\w)/);
  });

  it('keeps the Practice pointer when the model wrote a self pointer as the strategy', async () => {
    const outXml = await fill(fixture, lessonWithSelfPointerStrategy(SELF_POINTER_AT));
    expect(textOutsideAdaptiveCell(outXml)).toContain(SELF_POINTER_AT);
  });
});
