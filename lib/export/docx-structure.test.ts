import fs from 'fs';
import path from 'path';
import { TextEncoder, TextDecoder } from 'util';
import { generateDocx } from '@/lib/export/docx';
import {
  compareTableGridsToTemplate,
  docxUsesFixedTableLayout,
  summarizeDocxStructure,
} from '@/lib/export/docx-structure';
import JSZip from 'jszip';
import type { LessonPlan } from '@/types';

Object.assign(globalThis, { TextEncoder, TextDecoder });

const TEMPLATE_PATH = path.resolve(
  process.env.OBSERVATION_LESSON_TEMPLATE ??
    'C:/Users/tashi/Downloads/observation_lesson_plan_updated.docx',
);

const sampleLesson: LessonPlan = {
  id: 'test-id',
  user_id: 'user-id',
  title: 'Elements of a Story',
  subject: 'English Reading',
  grade: '9',
  curriculum: 'IB',
  duration_minutes: 60,
  model_used: 'test',
  token_count: 0,
  template_path: null,
  created_at: '',
  updated_at: '',
  content: {
    title: 'Elements of a Story — Reading Lesson',
    essentialQuestion: 'What makes a story feel real?',
    objectives: ['Students will identify story elements in a short text.'],
    successCriteria: ['Students can name all five elements'],
    keyConcepts: ['character', 'setting', 'plot'],
    vocabulary: ['character', 'setting', 'plot', 'conflict', 'theme'],
    hook: '5 min DO NOW with mystery image.',
    mainActivities: [
      '**10 min ACTIVATION**\n*Teacher Action:* Explain elements.\n*Student Action:* Take notes.\n*Resources:* Anchor chart.\n*Checks for Understanding:* Quiz.',
    ],
    guidedPractice: ['Guided organiser practice with teacher support.'],
    independentPractice: ['Independent labelling task.'],
    formativeAssessment: ['Exit ticket', 'Observations'],
    differentiation: {
      support: ['Pre-highlighted text.'],
      extension: ['Implicit theme analysis.'],
    },
    realWorldConnections: ['Film storytelling'],
    plenary: 'Exit ticket and summary sentence.',
  },
};

describe('docx tabular structure', () => {
  it('outputs exactly five tables with observation-plan headers', async () => {
    const buffer = await generateDocx(sampleLesson);
    const summary = await summarizeDocxStructure(buffer);

    expect(summary.tableCount).toBe(5);
    expect(summary.tables[0].firstRowCells).toBe(4);
    expect(summary.tables[1].gridCols).toHaveLength(5);
    expect(summary.tables[2].gridCols).toHaveLength(2);
    expect(summary.tables[3].gridCols).toHaveLength(5);
    expect(summary.tables[4].gridCols).toHaveLength(1);
    expect(summary.tables[4].rows).toBe(2);

    for (const table of summary.tables) {
      expect(table.gridSum).toBe(9360);
    }

    expect(summary.headers['Lesson Title']).toBe(true);
    expect(summary.headers['Planning and Pedagogical Approach']).toBe(true);
    expect(summary.headers['Teacher Activity']).toBe(true);
    expect(summary.headers['Self-Reflection: Data-Informed Future Planning']).toBe(true);
  });

  it('uses fixed table layout on all five tables', async () => {
    const buffer = await generateDocx(sampleLesson);
    const zip = await JSZip.loadAsync(buffer);
    const xml = await zip.file('word/document.xml')?.async('string');
    expect(xml).toBeTruthy();
    expect(docxUsesFixedTableLayout(xml!)).toBe(true);
  });

  it('matches observation template table grid layout', async () => {
    if (!fs.existsSync(TEMPLATE_PATH)) {
      return;
    }

    const generated = await summarizeDocxStructure(await generateDocx(sampleLesson));
    const template = await summarizeDocxStructure(fs.readFileSync(TEMPLATE_PATH));

    expect(template.tableCount).toBeGreaterThanOrEqual(5);
    expect(generated.tableCount).toBe(5);

    const issues = compareTableGridsToTemplate(generated.tables, template.tables.slice(0, 5));
    expect(issues).toEqual([]);
  });
});
