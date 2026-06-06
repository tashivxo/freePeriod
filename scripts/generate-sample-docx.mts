import fs from 'fs';
import path from 'path';
import { TextEncoder, TextDecoder } from 'util';
import JSZip from 'jszip';
import { generateDocx, parseActivityBlock } from '../lib/export/docx.ts';
import { buildExportFilename } from '../lib/export/filename.ts';
import { summarizeDocxStructure, docxUsesFixedTableLayout } from '../lib/export/docx-structure.ts';
import type { LessonPlan } from '../types/index.ts';

Object.assign(globalThis, { TextEncoder, TextDecoder });

const outDir = path.resolve('test-results/manual-lesson-exports');

function activityPhase(fields: {
  time: string;
  teacher: string[];
  learner: string[];
  assessment: string[];
  resources: string;
}): string {
  return [
    `Time: ${fields.time}`,
    `Teacher Activity: ${fields.teacher.join('\n')}`,
    `Learner Activity & Success Criteria: ${fields.learner.join('\n')}`,
    `Formative Assessment: ${fields.assessment.join('\n')}`,
    `Resources: ${fields.resources}`,
  ].join('\n');
}

const sampleLesson: LessonPlan = {
  id: 'manual-test',
  user_id: 'manual-test',
  title: 'Elements of a Story — Reading Lesson',
  subject: 'English Reading',
  grade: '9',
  curriculum: 'IB',
  duration_minutes: 60,
  model_used: 'manual-docx-test',
  token_count: 0,
  template_path: null,
  created_at: '',
  updated_at: '',
  content: {
    title: 'Elements of a Story — Reading Lesson',
    essentialQuestion: 'What makes a story feel real?',
    objectives: [
      'Students will identify and label the five elements of a story in a short text.',
      'Students will explain how each story element contributes to the overall meaning of the text.',
    ],
    successCriteria: [
      'I can name all five story elements in a short text',
      'I can explain how conflict and theme shape meaning',
    ],
    keyConcepts: ['character', 'setting', 'plot', 'conflict', 'theme'],
    vocabulary: ['character', 'setting', 'plot', 'conflict', 'theme', 'resolution', 'narrator'],
    hook: activityPhase({
      time: '5 min',
      teacher: ['Display mystery image', 'Pose prediction questions'],
      learner: [
        'Predict character, setting, and problem in pairs',
        'I can: make a reasonable prediction using visual evidence',
      ],
      assessment: ['Listen to pair discussions', 'Note common misconceptions'],
      resources: 'Projector, mystery image slide, pupil notebooks',
    }),
    mainActivities: [
      activityPhase({
        time: '10 min',
        teacher: ['Introduce five story elements on anchor chart', 'Run ClassPoint review quiz'],
        learner: [
          'Take notes on graphic organiser',
          'I can: name all five story elements',
          'I can: give one example for each element',
        ],
        assessment: ['Review ClassPoint quiz results', 'Cold-call three students'],
        resources: 'Anchor chart, ClassPoint quiz, graphic organisers, pupil notebooks',
      }),
      activityPhase({
        time: '25 min',
        teacher: ['Set group roles and circulate', 'Prompt groups with probing questions'],
        learner: [
          'Analyse differentiated texts in groups of four',
          'I can: label elements with text evidence',
          'I can: compare how conflict drives plot in two texts',
        ],
        assessment: ['Mid-lesson word cloud check', 'Spot-check one group per table'],
        resources: 'Differentiated texts, prompt cards, highlighters, Google Docs link',
      }),
    ],
    guidedPractice: [
      activityPhase({
        time: '8 min',
        teacher: ['Model one worked example on the board'],
        learner: [
          'Complete one scenario with teacher support',
          'I can: justify each label with a quote from the text',
        ],
        assessment: ['Check first item aloud with whole class'],
        resources: 'Whiteboard, graphic organiser, excerpt printout',
      }),
    ],
    independentPractice: [
      activityPhase({
        time: '10 min',
        teacher: ['Set timer and clarify success criteria'],
        learner: [
          'Label all five elements on a new short text independently',
          'I can: complete the organiser without teacher prompts',
        ],
        assessment: ['Collect organisers before plenary'],
        resources: 'Independent practice text, organiser, pencils',
      }),
    ],
    formativeAssessment: ['Think/Pair/Share', 'Exit ticket', 'Observations during group work'],
    differentiation: {
      support: ['Pre-highlighted text, sentence starters, and a word bank.'],
      extension: ['Analyse implicit theme and draft an alternate ending.'],
    },
    realWorldConnections: ['Film storytelling', 'Novel structure', 'Personal narratives'],
    plenary: activityPhase({
      time: '5 min',
      teacher: ['Facilitate whip-around and assign exit ticket'],
      learner: [
        'Share one-sentence summary of key learning',
        'I can: state how one story element changed my interpretation',
      ],
      assessment: ['Collect exit tickets before dismissal'],
      resources: 'Exit ticket slips, timer on board',
    }),
  },
};

for (const phase of [
  sampleLesson.content.hook,
  ...sampleLesson.content.mainActivities,
  ...sampleLesson.content.guidedPractice,
  ...sampleLesson.content.independentPractice,
  sampleLesson.content.plenary,
]) {
  const parsed = parseActivityBlock(phase);
  if (!parsed.teacher || !parsed.learner || !parsed.assessment || !parsed.resources) {
    throw new Error(`Activity phase missing fields: ${JSON.stringify(parsed)}`);
  }
  if (parsed.teacher.includes('*') || parsed.learner.includes('*')) {
    throw new Error('Markdown artifacts leaked into parsed activity fields');
  }
}

const buffer = await generateDocx(sampleLesson);
const filename = buildExportFilename(sampleLesson.subject, 'docx');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, filename);
fs.writeFileSync(outPath, buffer);

const summary = await summarizeDocxStructure(buffer);
const zip = await JSZip.loadAsync(buffer);
const xml = await zip.file('word/document.xml')?.async('string') ?? '';

console.log(`Wrote ${outPath}`);
console.log(`Tables: ${summary.tableCount}`);
console.log(`Headers OK: ${Object.values(summary.headers).every(Boolean)}`);
console.log(`Contains asterisks in body: ${/\*/.test(xml)}`);
console.log(`Fixed table layout: ${docxUsesFixedTableLayout(xml)}`);
console.log(`Table 4 column widths: ${summary.tables[3]?.gridCols.join(', ')}`);
