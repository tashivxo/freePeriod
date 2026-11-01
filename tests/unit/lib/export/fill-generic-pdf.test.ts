/**
 * @jest-environment node
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';
import { fillGenericPdfTemplate, valueForPdfField } from '@/lib/export/fill-generic-pdf';
import { isMeaningfulFill } from '@/lib/export/fill-template-result';
import type { LessonPlan } from '@/types';
import {
  REAL_EXTENSION,
  REAL_SUCCESS_AT,
  REAL_SUPPORT,
  SELF_POINTER_AT,
  SELF_POINTER_DEPTH,
  SELF_POINTER_TOWARDS,
  selfReferentialLesson,
} from '@/tests/helpers/adaptive-self-reference';

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

function lessonWithTitle(title: string): LessonPlan {
  return {
    ...sampleLesson,
    title,
    content: { ...sampleLesson.content, title },
  };
}

describe('fillGenericPdfTemplate Unicode text', () => {
  it('fills an Arabic-only title instead of skipping the field', async () => {
    const title = 'التمثيل الضوئي';
    const template = await makePdfWithFields([{ name: 'Lesson Title' }]);

    const result = await fillGenericPdfTemplate(template, lessonWithTitle(title));

    expect(result.filledCount).toBe(1);
    const filled = await PDFDocument.load(result.buffer);
    expect(filled.getForm().getTextField('Lesson Title').getText()).toBe(title);
    expect(result.buffer.toString('latin1')).toMatch(/NotoSans/);
  });

  it('keeps mixed Arabic and English in a title', async () => {
    const title = 'Lesson التمثيل الضوئي Grade 8';
    const template = await makePdfWithFields([{ name: 'Lesson Title' }]);

    const result = await fillGenericPdfTemplate(template, lessonWithTitle(title));

    expect(result.filledCount).toBe(1);
    const filled = await PDFDocument.load(result.buffer);
    const text = filled.getForm().getTextField('Lesson Title').getText();
    expect(text).toBe(title);
    expect(text).toContain('Lesson');
    expect(text).toContain('التمثيل الضوئي');
    expect(text).toContain('Grade 8');
  });

  it('leaves English-only field values unchanged', async () => {
    const template = await makePdfWithFields([
      { name: 'Lesson Title' },
      { name: 'objectives', multiline: true },
    ]);

    const result = await fillGenericPdfTemplate(template, sampleLesson);
    const filled = await PDFDocument.load(result.buffer);
    const form = filled.getForm();

    expect(form.getTextField('Lesson Title').getText()).toBe('Exploring States of Matter');
    expect(form.getTextField('objectives').getText()).toBe(
      '• Students will develop a model that predicts and describes changes in particle motion.',
    );
  });

  it('keeps mixed Arabic and English objective bullets', async () => {
    const lesson: LessonPlan = {
      ...sampleLesson,
      content: {
        ...sampleLesson.content,
        objectives: ['Students will learn', 'التمثيل الضوئي'],
      },
    };
    const template = await makePdfWithFields([{ name: 'objectives', multiline: true }]);
    const result = await fillGenericPdfTemplate(template, lesson);
    const text = (await PDFDocument.load(result.buffer)).getForm().getTextField('objectives').getText();
    expect(text).toContain('• Students will learn');
    expect(text).toContain('• التمثيل الضوئي');
  });

  it('fills Arabic objective bullets instead of dropping them', async () => {
    const lesson: LessonPlan = {
      ...sampleLesson,
      content: {
        ...sampleLesson.content,
        objectives: ['سيطور الطلاب نموذجا يصف حركة الجسيمات'],
      },
    };
    const template = await makePdfWithFields([{ name: 'objectives', multiline: true }]);
    const result = await fillGenericPdfTemplate(template, lesson);
    expect(result.filledCount).toBe(1);
    const text = (await PDFDocument.load(result.buffer)).getForm().getTextField('objectives').getText();
    expect(text).toContain('• سيطور الطلاب نموذجا يصف حركة الجسيمات');
  });
});

describe('PDF adaptive self references', () => {
  it('keeps self-referential pointers out of every mapped field value', () => {
    for (const field of [
      'Success Criteria',
      '{{successCriteria}}',
      'Differentiation',
      '{{differentiationSupport}}',
      '{{differentiationExtension}}',
      'SEN',
      'G&T',
    ]) {
      const value = valueForPdfField(field, selfReferentialLesson) ?? '';
      expect({ field, hasValue: value.length > 0 }).toEqual({ field, hasValue: true });
      for (const pointer of [SELF_POINTER_AT, SELF_POINTER_TOWARDS, SELF_POINTER_DEPTH]) {
        expect({ field, pointer: value.includes(pointer) }).toEqual({ field, pointer: false });
      }
    }
    expect(valueForPdfField('Success Criteria', selfReferentialLesson)).toContain(REAL_SUCCESS_AT);
    expect(valueForPdfField('{{differentiationSupport}}', selfReferentialLesson)).toBe(REAL_SUPPORT);
    expect(valueForPdfField('{{differentiationExtension}}', selfReferentialLesson)).toBe(REAL_EXTENSION);
  });

  it('writes filled PDF fields without the self pointer', async () => {
    const template = await makePdfWithFields([
      { name: 'Success Criteria', multiline: true },
      { name: 'Differentiation', multiline: true },
      { name: '{{differentiationSupport}}', multiline: true },
    ]);

    const result = await fillGenericPdfTemplate(template, selfReferentialLesson);
    expect(result.filledCount).toBe(3);

    const form = (await PDFDocument.load(result.buffer)).getForm();
    const texts = [
      form.getTextField('Success Criteria').getText() ?? '',
      form.getTextField('Differentiation').getText() ?? '',
      form.getTextField('{{differentiationSupport}}').getText() ?? '',
    ];
    for (const text of texts) {
      expect(text).not.toContain('See Adaptive Teaching');
      expect(text).not.toContain('\u2014');
    }
    expect(texts[0]).toContain(REAL_SUCCESS_AT);
    expect(texts[1]).toContain(REAL_SUPPORT);
    expect(texts[1]).toContain(REAL_EXTENSION);
  });

  it('keeps a pointer that sends the reader to a different section', () => {
    const lesson: LessonPlan = {
      ...selfReferentialLesson,
      content: {
        ...selfReferentialLesson.content,
        differentiation: { support: [REAL_SUPPORT, SELF_POINTER_AT], extension: [REAL_EXTENSION] },
      },
    };
    expect(valueForPdfField('{{differentiationSupport}}', lesson)).toContain(SELF_POINTER_AT);
  });
});
