/**
 * @jest-environment node
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';
import { fillGenericPdfTemplate, valueForPdfField } from '@/lib/export/fill-generic-pdf';
import { isMeaningfulFill } from '@/lib/export/fill-template-result';
import type { LessonPlan } from '@/types';

const STATIC_FORMAL_FIXTURE = readFileSync(
  path.join(process.cwd(), 'tests/fixtures/static-formal-lesson-plan.pdf'),
);

const sampleLesson: LessonPlan = {
  id: 'test-id',
  user_id: 'user-id',
  title: 'Exploring States of Matter',
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
    title: 'Exploring States of Matter',
    essentialQuestion: 'How do changes in thermal energy affect the state of matter?',
    objectives: [
      'Students will develop a model that predicts and describes changes in particle motion.',
    ],
    successCriteria: ['I can explain how particle motion changes during melting and freezing'],
    priorKnowledge: ['All matter is made of particles that are constantly in motion.'],
    performanceExpectations: ['MS-PS1-4'],
    misconceptions: ['Students often think particles stop moving in a solid.'],
    sciencePractices: ['Developing and using models'],
    keyConcepts: ['Particle motion increases with thermal energy.'],
    vocabulary: ['Phase — a distinct form of matter such as solid, liquid, or gas'],
    hook: 'Demo ice melting while students predict particle motion.',
    mainActivities: ['Model particle diagrams on whiteboards.'],
    guidedPractice: ['Complete practice diagrams with circulating prompts.'],
    independentPractice: ['Annotate a heating curve independently.'],
    formativeAssessment: ['Exit ticket describing particle changes during evaporation'],
    differentiation: {
      support: ['Provide annotated particle diagrams'],
      extension: ['Research sublimation examples'],
    },
    realWorldConnections: ['Water cycle and weather patterns'],
    plenary: 'Share one insight about melting versus freezing.',
  },
};

async function makePdfWithFields(
  fields: Array<{ name: string; multiline?: boolean }>,
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const form = pdfDoc.getForm();
  let y = 720;
  for (const field of fields) {
    const textField = form.createTextField(field.name);
    if (field.multiline) textField.enableMultiline();
    textField.addToPage(page, { x: 50, y, width: 400, height: field.multiline ? 80 : 24 });
    y -= field.multiline ? 100 : 36;
  }
  return Buffer.from(await pdfDoc.save());
}

describe('valueForPdfField', () => {
  it('matches human labels, camelCase keys, and {{placeholder}} names', () => {
    expect(valueForPdfField('Lesson Title', sampleLesson)).toBe('Exploring States of Matter');
    expect(valueForPdfField('objectives', sampleLesson)).toContain('Students will develop a model');
    expect(valueForPdfField('{{hook}}', sampleLesson)).toContain('Demo ice melting');
    expect(valueForPdfField('essentialQuestion', sampleLesson)).toContain('thermal energy');
    expect(valueForPdfField('Unknown District Field', sampleLesson)).toBeUndefined();
  });
});

describe('fillGenericPdfTemplate', () => {
  it('fills AcroForm text fields from lesson content', async () => {
    const template = await makePdfWithFields([
      { name: 'Lesson Title' },
      { name: 'objectives', multiline: true },
      { name: '{{hook}}', multiline: true },
      { name: 'Unknown District Field' },
    ]);

    const result = await fillGenericPdfTemplate(template, sampleLesson);

    expect(result.filledCount).toBe(3);
    expect(result.formFieldCount).toBe(4);
    expect(isMeaningfulFill(result.filledCount, result.matchedLabels)).toBe(true);

    const filled = await PDFDocument.load(result.buffer);
    const form = filled.getForm();
    expect(form.getTextField('Lesson Title').getText()).toBe('Exploring States of Matter');
    expect(form.getTextField('objectives').getText()).toContain('Students will develop a model');
    expect(form.getTextField('{{hook}}').getText()).toContain('Demo ice melting');
    expect(form.getTextField('Unknown District Field').getText() ?? '').toBe('');
  });

  it('returns no fill for a PDF without form fields', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage();
    const template = Buffer.from(await pdfDoc.save());

    const result = await fillGenericPdfTemplate(template, sampleLesson);

    expect(result.filledCount).toBe(0);
    expect(result.matchedLabels).toEqual([]);
    expect(result.formFieldCount).toBe(0);
    expect(isMeaningfulFill(result.filledCount, result.matchedLabels)).toBe(false);
  });

  it('does not treat title-only fills as meaningful', async () => {
    const template = await makePdfWithFields([{ name: 'Lesson Title' }]);
    const result = await fillGenericPdfTemplate(template, sampleLesson);
    expect(result.filledCount).toBe(1);
    expect(result.formFieldCount).toBe(1);
    expect(isMeaningfulFill(result.filledCount, result.matchedLabels)).toBe(false);
  });

  it('reports no form fields for the static Formal lesson-plan PDF fixture', async () => {
    const loaded = await PDFDocument.load(STATIC_FORMAL_FIXTURE);
    expect(loaded.getPageCount()).toBe(10);
    expect(loaded.getPage(0).getSize()).toEqual({ width: 792, height: 612 });
    expect(loaded.getForm().getFields()).toHaveLength(0);
    for (const page of loaded.getPages()) {
      const annots = page.node.Annots();
      expect(annots?.size() ?? 0).toBe(0);
    }
    const raw = STATIC_FORMAL_FIXTURE.toString('latin1');
    expect(raw).not.toMatch(/\/AcroForm/);
    expect(raw).not.toMatch(/\/Widget/);

    const result = await fillGenericPdfTemplate(STATIC_FORMAL_FIXTURE, sampleLesson);
    expect(result.filledCount).toBe(0);
    expect(result.matchedLabels).toEqual([]);
    expect(result.formFieldCount).toBe(0);
    expect(isMeaningfulFill(result.filledCount, result.matchedLabels)).toBe(false);
  });
});
