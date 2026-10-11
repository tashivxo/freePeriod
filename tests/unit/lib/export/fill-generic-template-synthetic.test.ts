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
  if (startIdx < 0) return '';
  if (!end) return text.slice(startIdx);
  const endIdx = text.indexOf(end, startIdx + start.length);
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

const grammarLesson: LessonPlan = {
  ...qaLesson,
  id: 'synthetic-grammar',
  content: {
    ...qaLesson.content,
    successCriteria: ['I can describe the effects of each.'],
    guidedPractice: [
      [
        'Time: 10 min',
        'Teacher Activity: DEMO_TEACHER_MARKER circulate and scaffold comparisons',
        'Learner Activity & Success Criteria: Contribute ideas about screen time.',
        'Formative Assessment: DEMO_ASSESS_MARKER spot checks',
        'Resources: DEMO_RESOURCE_MARKER practice sheet',
      ].join('\n'),
    ],
    independentPractice: [
      [
        'Time: 10 min',
        'Teacher Activity: assign the on-level worksheet',
        'Learner Activity & Success Criteria: Finish the exit review on screen time effects.',
        'Formative Assessment: check the first three items',
        'Resources: on-level worksheet',
      ].join('\n'),
    ],
    formativeAssessment: ['Students complete an exit ticket on screen time.'],
    differentiation: {
      support: ['Students use an annotated diagram with a model and prompts.'],
      extension: ['Students analyse a further example of each.'],
    },
  },
};

const FIXTURE = join(__dirname, '../../../fixtures/synthetic-daily-english-lesson-plan.docx');

const SIX_TEACHING_STRATEGIES = [
  'Scaffolding',
  'Differentiated Learning',
  'Think/Pair/Share',
  'Group Work',
  'Guided Practice (I do / We do / You do)',
  'Modelling',
];

const SEN_GT_LINES = [
  'SEN/LS: targeted access arrangements and in-lesson intervention for identified learners.',
  'G&T: targeted enrichment that increases depth of thinking, not extra volume.',
];

const sixStrategyLesson: LessonPlan = {
  ...qaLesson,
  id: 'synthetic-six-strategies',
  content: {
    ...qaLesson.content,
    keyConcepts: [
      ...(qaLesson.content.keyConcepts ?? []),
      'Use think pair share, modelling, and guided practice to surface ideas.',
    ],
  },
};

const realisticLesson: LessonPlan = {
  ...qaLesson,
  id: 'synthetic-realistic',
  content: {
    ...qaLesson.content,
    successCriteria: ['Define at least three effects of screen time.'],
    guidedPractice: [
      [
        'Time: 10 min',
        'Teacher Activity: DEMO_TEACHER_MARKER circulate and scaffold comparisons',
        'Learner Activity & Success Criteria: Provide sentence starters',
        'Formative Assessment: DEMO_ASSESS_MARKER spot checks',
        'Resources: DEMO_RESOURCE_MARKER practice sheet',
      ].join('\n'),
    ],
    independentPractice: [
      [
        'Time: 10 min',
        'Teacher Activity: assign the on-level worksheet',
        'Learner Activity & Success Criteria: Write an opinion paragraph about screen time,.',
        'Formative Assessment: check the first three items',
        'Resources: on-level worksheet',
      ].join('\n'),
    ],
    formativeAssessment: ['Write an exit ticket about screen time.'],
    differentiation: {
      support: ['Provide sentence starters'],
      extension: ['Write a stretch paragraph about screen time.'],
    },
  },
};

const cleanTemplateSlots = {
  activitySupported: 'Work with a teacher model and guided prompts to complete the task.',
  activityExpected: 'Complete the core task independently.',
  activityStretch: 'Extend the task by analysing a further example.',
  successCriteriaSupported: 'I can complete the task with a model and prompts.',
  successCriteriaExtended: 'I can apply this concept to a new scenario and justify my reasoning.',
  homeworkSupported: 'Complete a supported review of the exit ticket at home.',
  homeworkExpected: 'Finish the independent practice from the exit ticket at home.',
  homeworkStretch: 'Add one further example based on the exit ticket.',
  homeworkExtension: 'Write one stretch question based on the exit ticket.',
};

function grammarProblems(text: string): string[] {
  const problems: string[] = [];
  if (/\. and\b/i.test(text)) problems.push(`'. and' in ${JSON.stringify(text)}`);
  if (/\.\./.test(text)) problems.push(`'..' in ${JSON.stringify(text)}`);
  if (/ \./.test(text)) problems.push(`' .' in ${JSON.stringify(text)}`);
  if (/,\./.test(text)) problems.push(`',.' in ${JSON.stringify(text)}`);
  if (/\.\s+[a-z]/.test(text)) problems.push(`lowercase after full stop in ${JSON.stringify(text)}`);
  if (/\b(?:Revisit|Finish|Complete|Contribute|Add|Invent|Use|Extend|Supported|Stretch)\s+[A-Z][a-z]+\b/.test(text)) {
    problems.push(`verb followed by capitalised verb in ${JSON.stringify(text)}`);
  }
  if (
    /\b(?:using|on|about|of|to)\s+(?:write|provide|define|finish|add|invent|use|contribute|revisit|describe|explain|identify|analyse|analyze)\b/i.test(
      text,
    )
  ) {
    problems.push(`preposition followed by bare imperative in ${JSON.stringify(text)}`);
  }
  return problems;
}

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
    expect(atMastery).toContain('See Adaptive Teaching: Working At Mastery.');
    expect(atMastery).not.toContain('MASTERY_TASK_MARKER');
    expect(atMastery).not.toContain('DEMO_LEARNER_MARKER');
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

  it('places each support, mastery, and extension item in only one slot and caps growth', async () => {
    const templateBuffer = readFileSync(FIXTURE);
    const JSZip = (await import('jszip')).default;
    const templateXml = await (await JSZip.loadAsync(templateBuffer)).file('word/document.xml')!.async('string');
    const { outXml } = await fillSynthetic();
    const slots = collectListSlots(outXml);
    const markers = ['SUPPORT_MARKER', 'MASTERY_TASK_MARKER', 'EXTENSION_MARKER'];

    for (const marker of markers) {
      const homes = Object.entries(slots)
        .filter(([, text]) => text.includes(marker))
        .map(([name]) => name);
      expect({ marker, homes }).toEqual({ marker, homes: [expectedHome(marker)] });
    }

    expect(outXml.length).toBeLessThanOrEqual(Math.floor(templateXml.length * 2.2));
  });

  it('puts I can success criteria under Success criteria bands, not the activity tasks', async () => {
    const { outXml } = await fillSynthetic();
    const phases = activityPhaseRows(outXml);
    const practice = phases.find((phase) => /demonstration of learning/i.test(phase.heading));
    expect(practice).toBeDefined();

    const activities = practice!.texts[1];
    const success = practice!.texts[2];
    const atMasterySuccess = sliceBetween(success, '[2] Working at Mastery:', '[3]');

    expect(success).toContain('Differentiated success criteria:');
    expect(atMasterySuccess).toContain('SUCCESS_CRITERIA_MARKER');
    expect(atMasterySuccess).toMatch(/I can/i);
    expect(sliceBetween(success, 'Differentiated success criteria:', '')).not.toContain(
      'MASTERY_TASK_MARKER',
    );
    expect(activities).not.toContain('SUCCESS_CRITERIA_MARKER');
    expect(sliceBetween(activities, '[1]', '[2]')).not.toContain('SUPPORT_MARKER');
    expect(sliceBetween(activities, '[2]', '[3]')).not.toContain('MASTERY_TASK_MARKER');
    expect(sliceBetween(activities, '[3]', '')).not.toContain('EXTENSION_MARKER');
  });

  it('keeps Consolidation labels in order and writes discussion under Class Discussion', async () => {
    const { outXml } = await fillSynthetic();
    const plenary = activityPhaseRows(outXml).find((phase) => /consolidation/i.test(phase.heading));
    expect(plenary).toBeDefined();

    const teacher = plenary!.texts[1];
    const headingIdx = teacher.indexOf('Consolidation / Review');
    const classIdx = teacher.indexOf('Class Discussion:');
    const contentIdx = teacher.indexOf('PLENARY_TEACHER_MARKER');

    expect(headingIdx).toBeGreaterThanOrEqual(0);
    expect(classIdx).toBeGreaterThan(headingIdx);
    expect(contentIdx).toBeGreaterThan(classIdx);
  });

  it('fills leftover guidance slots with short level-specific text, not Adaptive list copies', async () => {
    const { outXml } = await fillSynthetic();
    const slots = collectListSlots(outXml);
    const adaptiveItems = [
      slots.adaptiveTowards,
      slots.adaptiveAtMastery,
      slots.adaptiveDepth,
    ].flatMap((text) => extractBulletItems(text));

    const activationDiff = slotBody(slots.activationDiff, 'Differentiation:', '');
    expect(activationDiff.length).toBeGreaterThan(12);
    expect(activationDiff).toMatch(/support|stretch|adaptive teaching/i);

    const act1 = slotBody(slots.practiceAct1, '[1]', '[2]');
    const act2 = slotBody(slots.practiceAct2, '[2]', '[3]');
    const act3 = slotBody(slots.practiceAct3, '[3]', '');
    expect(act1).toBe('See Adaptive Teaching: Working Towards Mastery.');
    expect(act2).toBe('See Adaptive Teaching: Working At Mastery.');
    expect(act3).toBe('See Adaptive Teaching: Mastery with Greater Depth.');
    expect(new Set([act1, act2, act3]).size).toBe(3);

    const sc1 = slotBody(slots.practiceSc1, '[1]', '[2]');
    const sc2 = slotBody(slots.practiceSc2, '[2]', '[3]');
    const sc3 = slotBody(slots.practiceSc3, '[3]', '');
    expect(sc1).toBe('I can complete the core task with support.');
    expect(sc2).toMatch(/i can/i);
    expect(sc3).toBe('I can extend the core task independently.');
    expect(new Set([sc1, sc2, sc3]).size).toBe(3);

    const hwTowards = slotBody(slots.homework, 'Working Towards Mastery:', 'Working At Mastery:');
    const hwAt = slotBody(slots.homework, 'Working At Mastery:', 'Mastery with Greater Depth:');
    const hwDepth = slotBody(slots.homework, 'Mastery with Greater Depth:', 'Extension:');
    const hwExtension = slotBody(slots.homework, 'Extension:', '');
    expect(hwTowards).toBe('Complete the independent practice task at your level with support.');
    expect(hwAt).toBe('Complete the independent practice task at your level.');
    expect(hwDepth).toBe('Complete the independent practice task at your level with greater depth.');
    expect(hwExtension).toBe('Complete the independent practice task at your level as an extension.');
    expect(new Set([hwTowards, hwAt, hwDepth, hwExtension]).size).toBe(4);
    for (const band of [hwTowards, hwAt, hwDepth, hwExtension]) {
      expect(band).not.toBe(
        'Complete a short reflection or practice task reinforcing the lesson objectives and vocabulary.',
      );
    }

    const derivedSlots = [activationDiff, act1, act2, act3, sc1, sc3, hwTowards, hwAt, hwDepth, hwExtension];
    for (const slot of derivedSlots) {
      expect(slot).not.toContain('SUPPORT_MARKER');
      expect(slot).not.toContain('MASTERY_TASK_MARKER');
      expect(slot).not.toContain('EXTENSION_MARKER');
      expect(grammarProblems(slot)).toEqual([]);
      for (const item of adaptiveItems) {
        expect(slot).not.toContain(item);
      }
    }
  });

  it('writes leftover slot lines as complete grammatical sentences', async () => {
    const { outXml } = await fillSynthetic(grammarLesson);
    const slots = collectListSlots(outXml);
    const derivedSlots = [
      slotBody(slots.activationDiff, 'Differentiation:', ''),
      slotBody(slots.practiceAct1, '[1]', '[2]'),
      slotBody(slots.practiceAct2, '[2]', '[3]'),
      slotBody(slots.practiceAct3, '[3]', ''),
      slotBody(slots.practiceSc1, '[1]', '[2]'),
      slotBody(slots.practiceSc2, '[2]', '[3]'),
      slotBody(slots.practiceSc3, '[3]', ''),
      slotBody(slots.homework, 'Working Towards Mastery:', 'Working At Mastery:'),
      slotBody(slots.homework, 'Working At Mastery:', 'Mastery with Greater Depth:'),
      slotBody(slots.homework, 'Mastery with Greater Depth:', 'Extension:'),
      slotBody(slots.homework, 'Extension:', ''),
    ];

    for (const slot of derivedSlots) {
      expect(slot.length).toBeGreaterThan(12);
      expect(grammarProblems(slot)).toEqual([]);
    }

    const act1 = derivedSlots[1];
    const act2 = derivedSlots[2];
    const act3 = derivedSlots[3];
    expect(act1).toMatch(/^[A-Z]/);
    expect(act2).toMatch(/^[A-Z]/);
    expect(act3).toMatch(/^[A-Z]/);
    expect(act1).toMatch(/[.!?]$/);
    expect(act2).toMatch(/[.!?]$/);
    expect(act3).toMatch(/[.!?]$/);
    expect(new Set([act1, act2, act3]).size).toBe(3);

    expect(derivedSlots[6]).toMatch(/^i can\b/i);
    expect(derivedSlots[6]).toMatch(/[.!?]$/);
    expect(derivedSlots[6]).not.toMatch(/and apply it to a further example/i);

    for (const band of derivedSlots.slice(7)) {
      expect(band).toMatch(/^[A-Z]/);
      expect(band).toMatch(/[.!?]$/);
      expect(band).not.toMatch(/contribute ideas/i);
      expect(band).not.toMatch(/brainstorm/i);
    }
  });

  it('keeps leftover slot lines grammatical for realistic imperative tasks', async () => {
    const { outXml } = await fillSynthetic(realisticLesson);
    const fallbackLines = leftoverSlotLines(outXml);
    expect(fallbackLines).toHaveLength(11);
    for (const slot of fallbackLines) {
      expect(slot.length).toBeGreaterThan(12);
      expect(grammarProblems(slot)).toEqual([]);
    }
    expect(fallbackLines[1]).toBe('See Adaptive Teaching: Working Towards Mastery.');
    expect(fallbackLines[2]).toBe('See Adaptive Teaching: Working At Mastery.');
    expect(fallbackLines[3]).toBe('See Adaptive Teaching: Mastery with Greater Depth.');
    expect(fallbackLines[4]).toBe('I can complete the core task with support.');
    expect(fallbackLines[6]).toBe('I can extend the core task independently.');
    expect(fallbackLines[7]).toBe('Complete the independent practice task at your level with support.');
    expect(fallbackLines[8]).toBe('Complete the independent practice task at your level.');
    expect(fallbackLines[9]).toBe('Complete the independent practice task at your level with greater depth.');
    expect(fallbackLines[10]).toBe('Complete the independent practice task at your level as an extension.');

    const slotted = await fillSynthetic({
      ...realisticLesson,
      content: {
        ...realisticLesson.content,
        templateSlots: cleanTemplateSlots,
      },
    });
    const slottedLines = leftoverSlotLines(slotted.outXml);
    expect(slottedLines).toHaveLength(11);
    for (const slot of slottedLines) {
      expect(grammarProblems(slot)).toEqual([]);
    }
    expect(slottedLines[1]).toBe(cleanTemplateSlots.activitySupported);
    expect(slottedLines[2]).toBe(cleanTemplateSlots.activityExpected);
    expect(slottedLines[3]).toBe(cleanTemplateSlots.activityStretch);
    expect(slottedLines[4]).toBe(cleanTemplateSlots.successCriteriaSupported);
    expect(slottedLines[6]).toBe(cleanTemplateSlots.successCriteriaExtended);
    expect(slottedLines[7]).toBe(cleanTemplateSlots.homeworkSupported);
    expect(slottedLines[8]).toBe(cleanTemplateSlots.homeworkExpected);
    expect(slottedLines[9]).toBe(cleanTemplateSlots.homeworkStretch);
    expect(slottedLines[10]).toBe(cleanTemplateSlots.homeworkExtension);
  });

  it('gives Working At Mastery its own strategy instead of repeating Practice learner text', async () => {
    const { outXml } = await fillSynthetic();
    const slots = collectListSlots(outXml);
    const practiceLearner = slotBody(slots.practiceLearner, 'Student-Centered Approach:', 'Differentiated success criteria:');
    const atMastery = slotBody(slots.adaptiveAtMastery, 'Working At Mastery', 'Mastery with Greater Depth');

    expect(practiceLearner).toContain('DEMO_LEARNER_MARKER');
    expect(practiceLearner).toContain('MASTERY_TASK_MARKER');
    expect(atMastery).toBe('See Adaptive Teaching: Working At Mastery.');
    expect(atMastery).not.toContain(practiceLearner);
    expect(atMastery).not.toContain('DEMO_LEARNER_MARKER');
    expect(atMastery).not.toContain('MASTERY_TASK_MARKER');
    expect(atMastery).not.toContain('I can:');

    const slotted = await fillSynthetic({
      ...qaLesson,
      content: {
        ...qaLesson.content,
        templateSlots: {
          activityExpected: 'Complete the on-level task independently with the core success criteria.',
        },
      },
    });
    const slottedAtMastery = slotBody(
      collectListSlots(slotted.outXml).adaptiveAtMastery,
      'Working At Mastery',
      'Mastery with Greater Depth',
    );
    expect(slottedAtMastery).toBe('See Adaptive Teaching: Working At Mastery.');
    expect(slottedAtMastery).not.toContain('DEMO_LEARNER_MARKER');
    expect(slottedAtMastery).not.toContain('MASTERY_TASK_MARKER');
  });

  it('does not repeat Practice [2] teacher text in Adaptive Working At Mastery', async () => {
    const strategy =
      'Students independently draft a structured opinion paragraph about screen time.';
    const { outXml } = await fillSynthetic({
      ...qaLesson,
      content: {
        ...qaLesson.content,
        templateSlots: {
          activityExpected: strategy,
        },
      },
    });
    const slots = collectListSlots(outXml);
    const practiceAct2 = slotBody(slots.practiceAct2, '[2]', '[3]');
    const practiceLearner = slotBody(
      slots.practiceLearner,
      'Student-Centered Approach:',
      'Differentiated success criteria:',
    );
    const atMastery = slotBody(slots.adaptiveAtMastery, 'Working At Mastery', 'Mastery with Greater Depth');

    expect(practiceAct2).toBe(strategy);
    expect(atMastery).toBe('See Adaptive Teaching: Working At Mastery.');
    expect(atMastery).not.toContain('Students independently draft');
    expect(normalizeCompareText(atMastery)).not.toBe(normalizeCompareText(practiceAct2));
    expect(normalizeCompareText(atMastery)).not.toBe(normalizeCompareText(practiceLearner));
  });

  it('replaces other Adaptive items that nearly duplicate Practice cell text', async () => {
    const { outXml } = await fillSynthetic({
      ...qaLesson,
      content: {
        ...qaLesson.content,
        differentiation: {
          support: ['DEMO_LEARNER_MARKER complete practice diagrams'],
          extension: ['MASTERY_TASK_MARKER complete the on-level worksheet'],
        },
      },
    });
    const slots = collectListSlots(outXml);
    const towards = slotBody(slots.adaptiveTowards, 'Working Towards Mastery', 'Working At Mastery');
    const depth = slotBody(slots.adaptiveDepth, 'Mastery with Greater Depth', 'Other adaptive');

    expect(towards).toBe('See Adaptive Teaching: Working Towards Mastery.');
    expect(depth).toBe('See Adaptive Teaching: Mastery with Greater Depth.');
    expect(towards).not.toContain('DEMO_LEARNER_MARKER');
    expect(depth).not.toContain('MASTERY_TASK_MARKER');
  });

  it('writes I can sentences in learner cells without a colon prefix', async () => {
    const lesson: LessonPlan = {
      ...qaLesson,
      content: {
        ...qaLesson.content,
        guidedPractice: [
          [
            'Time: 10 min',
            'Teacher Activity: DEMO_TEACHER_MARKER circulate and scaffold comparisons',
            'Learner Activity & Success Criteria: Complete practice diagrams.\nI can: name three particle changes.',
            'Formative Assessment: DEMO_ASSESS_MARKER spot checks',
            'Resources: DEMO_RESOURCE_MARKER practice sheet',
          ].join('\n'),
        ],
        independentPractice: [
          [
            'Time: 10 min',
            'Teacher Activity: assign the on-level worksheet',
            'Learner Activity & Success Criteria: Write an opinion paragraph about screen time.\nI can: justify one claim with evidence.',
            'Formative Assessment: check the first three items',
            'Resources: on-level worksheet',
          ].join('\n'),
        ],
      },
    };
    const { outXml } = await fillSynthetic(lesson);
    const phases = activityPhaseRows(outXml);
    for (const phase of phases) {
      expect(phase.texts[2]).not.toContain('I can:');
    }
    expect(adaptiveValueText(outXml)).not.toContain('I can:');
  });

  it('uses model-generated templateSlots when they are present', async () => {
    const lesson: LessonPlan = {
      ...qaLesson,
      content: {
        ...qaLesson.content,
        templateSlots: {
          activitySupported: 'Work with a teacher model and guided prompts to complete the task.',
          activityExpected: 'Complete the core task independently.',
          activityStretch: 'Extend the task by analysing a further example.',
          successCriteriaSupported: 'I can complete the task with a model and prompts.',
          successCriteriaExtended: 'I can apply this concept to a new scenario and justify my reasoning.',
          homeworkSupported: 'Complete a supported review of the exit ticket at home.',
          homeworkExpected: 'Finish the independent practice from the exit ticket at home.',
          homeworkStretch: 'Add one further example based on the exit ticket.',
          homeworkExtension: 'Write one stretch question based on the exit ticket.',
        },
      },
    };
    const { outXml } = await fillSynthetic(lesson);
    const slots = collectListSlots(outXml);

    expect(slotBody(slots.practiceAct1, '[1]', '[2]')).toBe(
      'Work with a teacher model and guided prompts to complete the task.',
    );
    expect(slotBody(slots.practiceAct2, '[2]', '[3]')).toBe('Complete the core task independently.');
    expect(slotBody(slots.practiceAct3, '[3]', '')).toBe(
      'Extend the task by analysing a further example.',
    );
    expect(slotBody(slots.practiceSc1, '[1]', '[2]')).toBe(
      'I can complete the task with a model and prompts.',
    );
    expect(slotBody(slots.practiceSc3, '[3]', '')).toBe(
      'I can apply this concept to a new scenario and justify my reasoning.',
    );
    expect(slotBody(slots.homework, 'Working Towards Mastery:', 'Working At Mastery:')).toBe(
      'Complete a supported review of the exit ticket at home.',
    );
    expect(slotBody(slots.homework, 'Working At Mastery:', 'Mastery with Greater Depth:')).toBe(
      'Finish the independent practice from the exit ticket at home.',
    );
    expect(slotBody(slots.homework, 'Mastery with Greater Depth:', 'Extension:')).toBe(
      'Add one further example based on the exit ticket.',
    );
    expect(slotBody(slots.homework, 'Extension:', '')).toBe(
      'Write one stretch question based on the exit ticket.',
    );
  });

  it('keeps SEN template prose intact and puts misconceptions only in a misconceptions slot', async () => {
    const { outXml } = await fillSynthetic();
    const adaptive = adaptiveValueText(outXml);
    const sen = adaptive.slice(adaptive.indexOf('Special Educational Needs'));
    const misconceptions = misconceptionsValueText(outXml);

    expect(misconceptions).toContain('MISCONCEPTION_MARKER');
    expect(sen).not.toContain('MISCONCEPTION_MARKER');
    expect(sen).toMatch(/targeted access arrangements|targeted enrichment/i);
    expect(cellPlainText(senLabelParagraph(outXml))).not.toContain('MISCONCEPTION_MARKER');
    expect(cellPlainText(senLabelParagraph(outXml))).not.toContain('targeted intervention for');
  });

  it('does not type a bullet glyph at the start of a paragraph that has numPr', async () => {
    const { outXml } = await fillSynthetic(sixStrategyLesson);
    const numbered = collectDocumentParagraphs(outXml).filter(paragraphHasNumPr);
    expect(numbered.length).toBeGreaterThan(0);

    const adaptiveCell = adaptiveValueCellXml(outXml);
    const strategyParas = paragraphsAfterHeading(adaptiveCell, /other adaptive/i, /special educational/i);
    expect(strategyParas).toHaveLength(SIX_TEACHING_STRATEGIES.length);
    expect(strategyParas.every(paragraphHasNumPr)).toBe(true);
    expect(strategyParas.map((para) => cellPlainText(para)).sort()).toEqual([...SIX_TEACHING_STRATEGIES].sort());

    const senParas = paragraphsAfterHeading(adaptiveCell, /special educational/i);
    expect(senParas).toHaveLength(SEN_GT_LINES.length);
    expect(senParas.every(paragraphHasNumPr)).toBe(true);
    expect(senParas.map((para) => cellPlainText(para))).toEqual(SEN_GT_LINES);

    const senCellParas = topLevelXml(valueCellXmlForLabel(outXml, /^sen$/i), 'w:p').filter(paragraphHasNumPr);
    const gtCellParas = topLevelXml(valueCellXmlForLabel(outXml, /^g&t$/i), 'w:p').filter(paragraphHasNumPr);
    expect(senCellParas.map((para) => cellPlainText(para)).join('\n')).toContain('SUPPORT_MARKER');
    expect(gtCellParas.map((para) => cellPlainText(para)).join('\n')).toContain('EXTENSION_MARKER');

    const doubled = numbered
      .map((para) => cellPlainText(para))
      .filter((text) => /^[•\-*]/.test(text));
    expect(doubled).toEqual([]);
  });

  it('does not leave an empty paragraph with numPr in the filled document', async () => {
    const { outXml } = await fillSynthetic({
      ...sixStrategyLesson,
      content: {
        ...sixStrategyLesson.content,
        independentPractice: [
          sixStrategyLesson.content.independentPractice[0],
          [
            'Time: 10 min',
            'Teacher Activity: assign a second practice task',
            'Learner Activity & Success Criteria: complete a second worksheet',
            'Formative Assessment: check completion',
            'Resources: second worksheet',
          ].join('\n'),
        ],
      },
    });
    expect(independentPracticeValueText(outXml)).toContain('MASTERY_TASK_MARKER');
    expect(independentPracticeValueText(outXml)).toContain('second practice task');
    expect(adaptiveValueText(outXml)).toContain('Think/Pair/Share');
    expect(adaptiveValueText(outXml)).toContain('SEN/LS:');
    expect(valueCellTextForLabel(outXml, /^sen$/i)).toContain('SUPPORT_MARKER');
    expect(valueCellTextForLabel(outXml, /^g&t$/i)).toContain('EXTENSION_MARKER');

    const emptyNumbered = collectDocumentParagraphs(outXml)
      .filter(paragraphHasNumPr)
      .filter((para) => cellPlainText(para) === '');
    expect(emptyNumbered).toEqual([]);
  });
});

function slotBody(text: string, start: string, end: string): string {
  const raw = sliceBetween(text, start, end);
  const withoutLabel = raw.startsWith(start) ? raw.slice(start.length) : raw;
  return withoutLabel
    .split('\n')
    .map((line) => line.replace(/^[•\s]+/, '').trim())
    .filter((line) => line && !/:$/.test(line) && !/^\[\d+\]/.test(line))
    .join('\n')
    .trim();
}

function extractBulletItems(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.replace(/^[•\s]+/, '').trim())
    .filter(
      (line) =>
        line.length > 0 &&
        !/^(working |other adaptive|special educational|prior knowledge|see adaptive teaching)/i.test(line),
    );
}

function expectedHome(marker: string): string {
  if (marker === 'SUPPORT_MARKER') return 'adaptiveTowards';
  if (marker === 'MASTERY_TASK_MARKER') return 'practiceLearner';
  return 'adaptiveDepth';
}

function normalizeCompareText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function leftoverSlotLines(xml: string): string[] {
  const slots = collectListSlots(xml);
  return [
    slotBody(slots.activationDiff, 'Differentiation:', ''),
    slotBody(slots.practiceAct1, '[1]', '[2]'),
    slotBody(slots.practiceAct2, '[2]', '[3]'),
    slotBody(slots.practiceAct3, '[3]', ''),
    slotBody(slots.practiceSc1, '[1]', '[2]'),
    slotBody(slots.practiceSc2, '[2]', '[3]'),
    slotBody(slots.practiceSc3, '[3]', ''),
    slotBody(slots.homework, 'Working Towards Mastery:', 'Working At Mastery:'),
    slotBody(slots.homework, 'Working At Mastery:', 'Mastery with Greater Depth:'),
    slotBody(slots.homework, 'Mastery with Greater Depth:', 'Extension:'),
    slotBody(slots.homework, 'Extension:', ''),
  ];
}

function collectListSlots(xml: string): Record<string, string> {
  const adaptive = adaptiveValueText(xml);
  const phases = activityPhaseRows(xml);
  const activation = phases.find((phase) => /activation/i.test(phase.heading));
  const practice = phases.find((phase) => /demonstration of learning/i.test(phase.heading));
  const plenary = phases.find((phase) => /consolidation/i.test(phase.heading));

  return {
    adaptiveTowards: sliceBetween(adaptive, 'Working Towards Mastery', 'Working At Mastery'),
    adaptiveAtMastery: sliceBetween(adaptive, 'Working At Mastery', 'Mastery with Greater Depth'),
    adaptiveDepth: sliceBetween(adaptive, 'Mastery with Greater Depth', 'Other adaptive'),
    adaptiveOther: sliceBetween(adaptive, 'Other adaptive', 'Special Educational Needs'),
    adaptiveSen: adaptive.slice(adaptive.indexOf('Special Educational Needs')),
    activationDiff: sliceBetween(activation?.texts[2] ?? '', 'Differentiation:', ''),
    practiceLearner: practice?.texts[2] ?? '',
    practiceAct1: sliceBetween(practice?.texts[1] ?? '', '[1]', '[2]'),
    practiceAct2: sliceBetween(practice?.texts[1] ?? '', '[2]', '[3]'),
    practiceAct3: sliceBetween(practice?.texts[1] ?? '', '[3]', ''),
    practiceSc1: sliceBetween(practice?.texts[2] ?? '', '[1]', '[2]'),
    practiceSc2: sliceBetween(practice?.texts[2] ?? '', '[2]', '[3]'),
    practiceSc3: sliceBetween(practice?.texts[2] ?? '', '[3]', ''),
    homework: sliceBetween(plenary?.texts[2] ?? '', 'Homework Differentiation', ''),
  };
}

function misconceptionsValueText(xml: string): string {
  for (const tbl of topLevelXml(xml, 'w:tbl')) {
    for (const row of topLevelXml(tbl, 'w:tr')) {
      const cells = topLevelXml(row, 'w:tc');
      if (cells.length < 2) continue;
      if (/possible misconceptions/i.test(cellPlainText(cells[0] ?? ''))) {
        return cellPlainText(cells[1] ?? '');
      }
    }
  }
  return '';
}

function adaptiveValueCellXml(xml: string): string {
  return valueCellXmlForLabel(xml, /adaptive teaching/i);
}

function valueCellXmlForLabel(xml: string, labelRe: RegExp): string {
  for (const tbl of topLevelXml(xml, 'w:tbl')) {
    for (const row of topLevelXml(tbl, 'w:tr')) {
      const cells = topLevelXml(row, 'w:tc');
      if (cells.length < 2) continue;
      if (labelRe.test(cellPlainText(cells[0] ?? '').trim())) {
        return cells[1] ?? '';
      }
    }
  }
  return '';
}

function valueCellTextForLabel(xml: string, labelRe: RegExp): string {
  return cellPlainText(valueCellXmlForLabel(xml, labelRe));
}

function paragraphsAfterHeading(cellXml: string, headingRe: RegExp, untilRe?: RegExp): string[] {
  const paras = topLevelXml(cellXml, 'w:p');
  const start = paras.findIndex((para) => headingRe.test(cellPlainText(para)));
  if (start < 0) return [];
  const collected: string[] = [];
  for (const para of paras.slice(start + 1)) {
    const text = cellPlainText(para);
    if (untilRe?.test(text)) break;
    if (/:$/.test(text) && text.length < 80) break;
    collected.push(para);
  }
  return collected;
}

function collectDocumentParagraphs(xml: string): string[] {
  const paras: string[] = [];
  for (const tbl of topLevelXml(xml, 'w:tbl')) {
    for (const row of topLevelXml(tbl, 'w:tr')) {
      for (const cell of topLevelXml(row, 'w:tc')) {
        paras.push(...topLevelXml(cell, 'w:p'));
      }
    }
  }
  return paras;
}

function paragraphHasNumPr(paraXml: string): boolean {
  return /<w:numPr\b/.test(paraXml);
}

function independentPracticeValueText(xml: string): string {
  for (const tbl of topLevelXml(xml, 'w:tbl')) {
    for (const row of topLevelXml(tbl, 'w:tr')) {
      const cells = topLevelXml(row, 'w:tc');
      if (cells.length < 2) continue;
      if (/independent practice/i.test(cellPlainText(cells[0] ?? ''))) {
        return cellPlainText(cells[1] ?? '');
      }
    }
  }
  return '';
}

function senLabelParagraph(xml: string): string {
  for (const tbl of topLevelXml(xml, 'w:tbl')) {
    for (const row of topLevelXml(tbl, 'w:tr')) {
      const cells = topLevelXml(row, 'w:tc');
      if (cells.length < 2) continue;
      if (!/adaptive teaching/i.test(cellPlainText(cells[0] ?? ''))) continue;
      const para = topLevelXml(cells[1] ?? '', 'w:p').find((item) =>
        /special educational needs/i.test(cellPlainText(item)),
      );
      return para ?? '';
    }
  }
  return '';
}
