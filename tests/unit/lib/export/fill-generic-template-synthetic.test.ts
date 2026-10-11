import { readFileSync } from 'fs';
import { join } from 'path';
import { TextEncoder, TextDecoder } from 'util';
import { cellPlainText, fillGenericDocxTemplate } from '@/lib/export/fill-generic-template';
import type { LessonPlan } from '@/types';

Object.assign(globalThis, { TextEncoder, TextDecoder });

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

function topLevelXml(xml: string, localName: string): string[] {
  const close = `</${localName}>`;
  const segments: string[] = [];
  let i = 0;
  while (i < xml.length) {
    const start = findWordTagOpen(xml, localName, i);
    if (start < 0) break;
    const openEnd = xml.indexOf('>', start);
    if (openEnd < 0) break;
    const closeIdx = findMatchingWordClose(xml, openEnd + 1, localName);
    if (closeIdx < 0) break;
    const end = closeIdx + close.length;
    segments.push(xml.slice(start, end));
    i = end;
  }
  return segments;
}

function vMergeKind(cellXml: string): 'restart' | 'continue' | null {
  if (/<w:vMerge\b[^>]*w:val="restart"/.test(cellXml)) return 'restart';
  if (/<w:vMerge\b/.test(cellXml)) return 'continue';
  return null;
}

function activityPhaseRows(xml: string): Array<{
  heading: string;
  cellsXml: string[];
  texts: string[];
}> {
  const rows: Array<{ heading: string; cellsXml: string[]; texts: string[] }> = [];
  for (const tbl of topLevelXml(xml, 'w:tbl')) {
    for (const row of topLevelXml(tbl, 'w:tr')) {
      const cellsXml = topLevelXml(row, 'w:tc');
      if (cellsXml.length < 5) continue;
      const heading = cellPlainText(cellsXml[1] ?? '').split('\n')[0] ?? '';
      if (
        /do now|activation|demonstration of learning|consolidation/i.test(heading)
      ) {
        rows.push({
          heading,
          cellsXml,
          texts: cellsXml.map((cell) => cellPlainText(cell)),
        });
      }
    }
  }
  return rows;
}

function sliceBetween(text: string, start: string, end: string): string {
  const startIdx = text.indexOf(start);
  const endIdx = text.indexOf(end, startIdx + start.length);
  if (startIdx < 0) return '';
  if (endIdx < 0) return text.slice(startIdx);
  return text.slice(startIdx, endIdx);
}

function parsePhaseMinutes(text: string): number {
  const match = text.match(/(\d+)\s*min/i);
  return match ? parseInt(match[1], 10) : 0;
}

function adaptiveValueText(xml: string): string {
  for (const tbl of topLevelXml(xml, 'w:tbl')) {
    for (const row of topLevelXml(tbl, 'w:tr')) {
      const cells = topLevelXml(row, 'w:tc');
      if (cells.length < 2) continue;
      if (/adaptive teaching/i.test(cellPlainText(cells[0] ?? ''))) {
        return cellPlainText(cells[1] ?? '');
      }
    }
  }
  return '';
}

const qaLesson: LessonPlan = {
  id: 'synthetic-qa',
  user_id: 'user-id',
  title: 'States of Matter Practice',
  subject: 'Science',
  grade: '6',
  curriculum: 'NGSS',
  duration_minutes: 60,
  model_used: 'test',
  token_count: 0,
  template_path: null,
  created_at: '',
  updated_at: '',
  content: {
    title: 'States of Matter Practice',
    essentialQuestion: 'How does heating change a solid into a liquid?',
    objectives: [
      'Students will describe how particle motion changes when thermal energy is added.',
    ],
    successCriteria: ['SUCCESS_CRITERIA_MARKER I can state the core idea'],
    priorKnowledge: ['PRIOR_KNOWLEDGE_MARKER particles stay in motion'],
    misconceptions: ['MISCONCEPTION_MARKER particles stop in a solid'],
    keyConcepts: ['Particle motion increases as thermal energy increases'],
    vocabulary: ['melting', 'particle'],
    hook: [
      'Time: 5 min',
      'Teacher Activity: HOOK_TEACHER_MARKER demo ice melting',
      'Learner Activity & Success Criteria: HOOK_LEARNER_MARKER observe and predict',
      'Formative Assessment: HOOK_ASSESS_MARKER pair share',
      'Resources: HOOK_RESOURCE_MARKER ice and beaker',
    ].join('\n'),
    mainActivities: [
      [
        'Time: 20 min',
        'Teacher Activity: ACTIVATION_TEACHER_MARKER model particle diagrams',
        'Learner Activity & Success Criteria: ACTIVATION_LEARNER_MARKER draw models in groups',
        'Formative Assessment: ACTIVATION_ASSESS_MARKER gallery walk',
        'Resources: ACTIVATION_RESOURCE_MARKER whiteboard pens',
      ].join('\n'),
    ],
    guidedPractice: [
      [
        'Time: 10 min',
        'Teacher Activity: DEMO_TEACHER_MARKER circulate and scaffold comparisons',
        'Learner Activity & Success Criteria: DEMO_LEARNER_MARKER complete practice diagrams',
        'Formative Assessment: DEMO_ASSESS_MARKER spot checks',
        'Resources: DEMO_RESOURCE_MARKER practice sheet',
      ].join('\n'),
    ],
    independentPractice: [
      [
        'Time: 10 min',
        'Teacher Activity: assign the on-level worksheet',
        'Learner Activity & Success Criteria: MASTERY_TASK_MARKER complete the on-level worksheet',
        'Formative Assessment: check the first three items',
        'Resources: on-level worksheet',
      ].join('\n'),
    ],
    formativeAssessment: ['FORMATIVE_MARKER exit slip'],
    differentiation: {
      support: ['SUPPORT_MARKER annotated diagram with scaffolding'],
      extension: ['EXTENSION_MARKER deeper investigation'],
    },
    realWorldConnections: ['REAL_WORLD_MARKER water cycle'],
    plenary: [
      'Time: 5 min',
      'Teacher Activity: PLENARY_TEACHER_MARKER summarize',
      'Learner Activity & Success Criteria: PLENARY_LEARNER_MARKER share one insight',
      'Formative Assessment: PLENARY_ASSESS_MARKER thumbs up or down',
      'Resources: PLENARY_RESOURCE_MARKER notebook',
    ].join('\n'),
  },
};

const FIXTURE = join(__dirname, '../../../fixtures/synthetic-daily-english-lesson-plan.docx');

async function fillSynthetic(lesson: LessonPlan = qaLesson) {
  const templateBuffer = readFileSync(FIXTURE);
  const result = await fillGenericDocxTemplate(templateBuffer, lesson);
  const JSZip = (await import('jszip')).default;
  const outZip = await JSZip.loadAsync(result.buffer);
  const outXml = await outZip.file('word/document.xml')!.async('string');
  return { result, outXml };
}

describe('synthetic daily English template fill', () => {
  it('writes every phase resource into the visible vMerge restart cell', async () => {
    const { outXml } = await fillSynthetic();
    const phases = activityPhaseRows(outXml);
    expect(phases).toHaveLength(4);

    const restart = phases
      .map((phase) => phase.cellsXml[4] ?? '')
      .find((cell) => vMergeKind(cell) === 'restart');
    const hidden = phases
      .map((phase) => phase.cellsXml[4] ?? '')
      .filter((cell) => vMergeKind(cell) === 'continue');

    expect(restart).toBeDefined();
    const visible = cellPlainText(restart ?? '');
    expect(visible).toContain('HOOK_RESOURCE_MARKER');
    expect(visible).toContain('ACTIVATION_RESOURCE_MARKER');
    expect(visible).toContain('DEMO_RESOURCE_MARKER');
    expect(visible).toContain('PLENARY_RESOURCE_MARKER');
    expect(visible).toMatch(/Do Now/i);
    expect(visible).toMatch(/Activation/i);
    expect(visible).toMatch(/Demonstration|Practice/i);
    expect(visible).toMatch(/Consolidation|Review/i);

    for (const cell of hidden) {
      const text = cellPlainText(cell);
      expect(text).not.toContain('ACTIVATION_RESOURCE_MARKER');
      expect(text).not.toContain('DEMO_RESOURCE_MARKER');
      expect(text).not.toContain('PLENARY_RESOURCE_MARKER');
    }
  });

  it('keeps guidance sub-labels and inserts matching content under them', async () => {
    const { outXml } = await fillSynthetic();
    const phases = activityPhaseRows(outXml);
    const activation = phases.find((phase) => /activation/i.test(phase.heading));
    const practice = phases.find((phase) => /demonstration of learning/i.test(phase.heading));
    const plenary = phases.find((phase) => /consolidation/i.test(phase.heading));

    expect(activation).toBeDefined();
    expect(practice).toBeDefined();
    expect(plenary).toBeDefined();

    const activationLearner = activation!.texts[2];
    const activationAssess = activation!.texts[3];
    const practiceTeacher = practice!.texts[1];
    const practiceLearner = practice!.texts[2];
    const practiceAssess = practice!.texts[3];
    const plenaryLearner = plenary!.texts[2];
    const plenaryAssess = plenary!.texts[3];

    expect(activationLearner).toContain('Student Participation:');
    expect(activationLearner).toContain('Differentiation:');
    expect(activationAssess).toContain('Formal Introduction:');
    expect(practiceTeacher).toContain('[1] Working Towards Mastery:');
    expect(practiceTeacher).toContain('[2] Working at Mastery:');
    expect(practiceTeacher).toContain('[3] Mastery with Greater Depth:');
    expect(practiceLearner).toContain('Student-Centered Approach:');
    expect(practiceLearner).toContain('Differentiated success criteria:');
    expect(practiceAssess).toContain('Formative Data:');
    expect(plenaryLearner).toContain('Plenary:');
    expect(plenaryLearner).toContain('Homework Differentiation');
    expect(plenaryAssess).toContain('Formative Data:');

    const participationIdx = activationLearner.indexOf('Student Participation:');
    const learnerIdx = activationLearner.indexOf('ACTIVATION_LEARNER_MARKER');
    const diffIdx = activationLearner.indexOf('Differentiation:');
    expect(learnerIdx).toBeGreaterThan(participationIdx);
    expect(learnerIdx).toBeLessThan(diffIdx);

    const formalIdx = activationAssess.indexOf('Formal Introduction:');
    const assessIdx = activationAssess.indexOf('ACTIVATION_ASSESS_MARKER');
    expect(assessIdx).toBeGreaterThan(formalIdx);

    expect(practiceAssess.indexOf('DEMO_ASSESS_MARKER')).toBeGreaterThan(
      practiceAssess.indexOf('Formative Data:'),
    );
    expect(plenaryLearner.indexOf('PLENARY_LEARNER_MARKER')).toBeGreaterThan(
      plenaryLearner.indexOf('Plenary:'),
    );
  });

  it('routes adaptive slots to mastery tasks, adaptive strategies, and distinct SEN content', async () => {
    const { outXml } = await fillSynthetic();
    const adaptive = adaptiveValueText(outXml);
    expect(adaptive).toContain('Prior knowledge:');
    expect(adaptive).toContain('Working At Mastery');

    const atMastery = sliceBetween(adaptive, 'Working At Mastery', 'Mastery with Greater Depth');
    expect(atMastery).toContain('MASTERY_TASK_MARKER');
    expect(atMastery).not.toContain('SUCCESS_CRITERIA_MARKER');

    const other = sliceBetween(adaptive, 'Other adaptive', 'Special Educational Needs');
    expect(other).toMatch(/Scaffolding|Differentiated Learning|Group Work/i);
    expect(other).not.toContain('REAL_WORLD_MARKER');

    const sen = adaptive.slice(adaptive.indexOf('Special Educational Needs'));
    expect(sen).not.toContain('SUPPORT_MARKER');
    expect(sen).not.toContain('EXTENSION_MARKER');
    expect(sen).toMatch(/SEN\/LS|targeted/i);
  });

  it('keeps printed Practice time and makes phase times sum to the lesson duration', async () => {
    const { outXml } = await fillSynthetic();
    const phases = activityPhaseRows(outXml);
    const practice = phases.find((phase) => /demonstration of learning/i.test(phase.heading));
    expect(practice).toBeDefined();
    expect(practice!.texts[0]).toContain('25 min');
    expect(practice!.texts[0]).toContain('Check progress every few minutes');

    const minutes = phases.map((phase) => parsePhaseMinutes(phase.texts[0]));
    expect(minutes.reduce((sum, value) => sum + value, 0)).toBe(60);
    expect(minutes.every((value) => value > 0)).toBe(true);
  });
});
