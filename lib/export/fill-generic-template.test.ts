import { TextEncoder, TextDecoder } from 'util';
import {
  buildFieldMap,
  fillGenericDocxTemplate,
  highlightCheckboxCell,
  normalizeLabel,
} from './fill-generic-template';
import type { LessonPlan } from '@/types';

Object.assign(globalThis, { TextEncoder, TextDecoder });

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
      'Students will develop a model that predicts and describes changes in particle motion when thermal energy is added or removed.',
    ],
    successCriteria: ['I can explain how particle motion changes during melting and freezing'],
    priorKnowledge: [
      'Students should already understand that all matter is made of particles that are constantly in motion.',
      'Students should know the three common states of matter: solid, liquid, and gas.',
    ],
    performanceExpectations: [
      'MS-PS1-4: Develop a model that predicts and describes changes in particle motion, temperature, and state of a pure substance when thermal energy is added or removed.',
    ],
    misconceptions: [
      'Students often think particles stop moving in a solid — addressed by comparing vibration in solids to free movement in liquids.',
    ],
    sciencePractices: [
      'Developing and using models to represent particle arrangement in solids, liquids, and gases.',
    ],
    keyConcepts: [
      'Particle motion — particles move faster as thermal energy increases and slower as it decreases.',
    ],
    vocabulary: ['Phase — a distinct form of matter such as solid, liquid, or gas'],
    hook: 'Time: 5 min\nTeacher Activity: Demo ice melting\nLearner Activity & Success Criteria: Observe and predict\nFormative Assessment: Pair share\nResources: Ice, beaker',
    mainActivities: ['Time: 20 min\nTeacher Activity: Model particle diagrams\nLearner Activity & Success Criteria: Draw models\nFormative Assessment: Gallery walk\nResources: Whiteboard'],
    guidedPractice: [],
    independentPractice: [],
    formativeAssessment: ['Exit ticket describing particle changes during evaporation'],
    differentiation: { support: ['Provide annotated particle diagrams'], extension: ['Research sublimation examples'] },
    realWorldConnections: ['Water cycle and weather patterns'],
    plenary: 'Time: 5 min\nTeacher Activity: Summarize\nLearner Activity & Success Criteria: Share one insight\nFormative Assessment: Thumbs up/down\nResources: Notebook',
  },
};

describe('fill-generic-template field mapping', () => {
  it('maps science template labels to substantive planning content', () => {
    const map = buildFieldMap(sampleLesson);

    expect(map.get(normalizeLabel('Module Prior Knowledge'))).toContain('particles');
    expect(map.get(normalizeLabel('Module Performance Expectations (PEs)'))).toContain('MS-PS1-4');
    expect(map.get(normalizeLabel('Lesson Possible Misconception(s)'))).toContain('solid');
    expect(map.get(normalizeLabel('Module Science & Engineering Practices (SEPs'))).toContain('models');
    expect(map.get(normalizeLabel('Lesson Key Vocabulary'))).toContain('Phase —');
  });

  it('fills a minimal table template with prior knowledge and performance expectations', async () => {
    const templateXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:tbl>
      <w:tr>
        <w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>Module Prior Knowledge</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="9000" w:type="dxa"/></w:tcPr><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>Module Performance Expectations (PEs)</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="9000" w:type="dxa"/></w:tcPr><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
      </w:tr>
    </w:tbl>
  </w:body>
</w:document>`;

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    zip.file('word/document.xml', templateXml);
    zip.file('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>');
    const templateBuffer = Buffer.from(await zip.generateAsync({ type: 'nodebuffer' }));

    const result = await fillGenericDocxTemplate(templateBuffer, sampleLesson);
    const outZip = await JSZip.loadAsync(result.buffer);
    const outXml = await outZip.file('word/document.xml')!.async('string');

    expect(result.filledCount).toBe(2);
    expect(outXml).toContain('MS-PS1-4');
    expect(outXml).toContain('particles that are constantly in motion');
  });

  it('highlights applicable checkbox options in place', () => {
    const cellXml = `<w:tc><w:p><w:r><w:t>Please highlight all that apply:Analysis / Evaluation / Making connections / Drawing conclusions</w:t></w:r></w:p></w:tc>`;
    const highlighted = highlightCheckboxCell(cellXml, ['Analysis', 'Making connections']);

    expect(highlighted).toContain('Analysis');
    expect(highlighted).toContain('<w:b/>');
    expect(highlighted).toContain('Making connections');
  });

  it('maps homework and assessment template labels', () => {
    const map = buildFieldMap({
      ...sampleLesson,
      content: {
        ...sampleLesson.content,
        independentPractice: [
          'Time: 10 min\nTeacher Activity: Assign worksheet\nLearner Activity & Success Criteria: Complete at home\nFormative Assessment: Review next lesson\nResources: Worksheet',
        ],
        formativeAssessment: [
          'Classification performance task',
          'Written explanation of particle models',
          'Short vocabulary quiz',
        ],
      },
    });

    expect(map.get(normalizeLabel('Homework'))).toContain('worksheet');
    expect(map.get(normalizeLabel('AssessmentPerformance task:Writing activities:Quizzes:'))).toContain(
      'Classification performance task',
    );
  });
});
