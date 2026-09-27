import { readFileSync } from 'fs';
import { join } from 'path';
import { TextEncoder, TextDecoder } from 'util';
import {
  buildFieldMap,
  fillGenericDocxTemplate,
  highlightCheckboxCell,
  normalizeLabel,
} from '@/lib/export/fill-generic-template';
import { isMeaningfulFill } from '@/lib/export/fill-template-result';
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

  it('fills a minimal table template with CJK prior knowledge and YaHei east-Asian font', async () => {
    const chinesePriorKnowledge = '学生应已理解物质由不断运动的粒子组成。';
    const cjkLesson: LessonPlan = {
      ...sampleLesson,
      content: {
        ...sampleLesson.content,
        priorKnowledge: [chinesePriorKnowledge],
      },
    };

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

    const result = await fillGenericDocxTemplate(templateBuffer, cjkLesson);
    const outZip = await JSZip.loadAsync(result.buffer);
    const outXml = await outZip.file('word/document.xml')!.async('string');

    expect(result.filledCount).toBe(2);
    expect(outXml).toContain(chinesePriorKnowledge);
    expect(outXml).toContain('w:eastAsia="Microsoft YaHei"');
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

  it('maps daily English / school-form labels used on generic templates', () => {
    const map = buildFieldMap(sampleLesson);

    expect(map.get(normalizeLabel('Topic'))).toBe('Exploring States of Matter');
    expect(map.get(normalizeLabel('Learning Outcomes'))).toContain('particle motion');
    expect(map.get(normalizeLabel('Introduction'))).toContain('Demo ice melting');
    expect(map.get(normalizeLabel('Development'))).toContain('Model particle diagrams');
    expect(map.get(normalizeLabel('Conclusion'))).toContain('Summarize');
    expect(map.get(normalizeLabel('Subject'))).toBe('Science');
    expect(map.get(normalizeLabel('Grade'))).toBe('Grade 6');
    expect(map.get(normalizeLabel('Grade/Class'))).toBe('Grade 6');
    expect(map.get(normalizeLabel('New Vocabulary (if any)'))).toContain('Phase —');
    expect(map.get(normalizeLabel('Demonstration of Learning'))).toContain('Model particle diagrams');
  });

  it('returns filledCount 0 and the original buffer when no labels match', async () => {
    const templateXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:tbl>
      <w:tr>
        <w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>School crest</w:t></w:r></w:p></w:tc>
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

    expect(result.filledCount).toBe(0);
    expect(result.matchedLabels).toEqual([]);
    const outZip = await JSZip.loadAsync(result.buffer);
    const outXml = await outZip.file('word/document.xml')!.async('string');
    expect(outXml).not.toContain('Exploring States of Matter');
    expect(outXml).toContain('School crest');
  });

  it('overwrites sample EQ/vocab/objectives cells and rejects title-only as unfilled', async () => {
    const templateXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:tbl>
      <w:tr>
        <w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>Lesson Title</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="9000" w:type="dxa"/></w:tcPr><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>Duration</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="9000" w:type="dxa"/></w:tcPr><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr>
          <w:p><w:r><w:t>Learning Objectives</w:t></w:r></w:p>
          <w:p><w:r><w:t>What are learners expected to master during the lesson? These should be specific and measurable.</w:t></w:r></w:p>
        </w:tc>
        <w:tc><w:tcPr><w:tcW w:w="9000" w:type="dxa"/></w:tcPr><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>Essential Question(s)</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="9000" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>Visual media in the UAE has helped its people learn about their culture &amp; values. Do you agree? Why/Why not?</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>New Vocabulary (if any)</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="9000" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>Couch potato, flexibility, mobility, entertainment</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>Activities</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="9000" w:type="dxa"/></w:tcPr>
          <w:p><w:r><w:t>Write the main activity here.</w:t></w:r></w:p>
          <w:p><w:r><w:t>Leave this stub if unused.</w:t></w:r></w:p>
        </w:tc>
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

    expect(result.filledCount).toBeGreaterThanOrEqual(5);
    expect(result.matchedLabels).toEqual(
      expect.arrayContaining([
        'lesson title',
        'duration',
        'learning objectives',
        'essential questions',
        'new vocabulary if any',
        'activities',
      ]),
    );
    expect(isMeaningfulFill(result.filledCount, result.matchedLabels)).toBe(true);
    expect(outXml).toContain('How do changes in thermal energy affect the state of matter?');
    expect(outXml).toContain('particle motion');
    expect(outXml).toContain('Phase —');
    expect(outXml).toContain('Model particle diagrams');
    expect(outXml).not.toContain('Visual media in the UAE');
    expect(outXml).not.toContain('Couch potato');
    expect(outXml).not.toContain('Write the main activity here.');

    const titleOnly = await fillGenericDocxTemplate(templateBuffer, {
      ...sampleLesson,
      duration_minutes: 45,
      content: {
        ...sampleLesson.content,
        title: 'Header Only Lesson',
        essentialQuestion: '',
        objectives: [],
        vocabulary: [],
        hook: '',
        mainActivities: [],
        guidedPractice: [],
        independentPractice: [],
        plenary: '',
        differentiation: { support: [], extension: [] },
      },
    });
    expect(titleOnly.matchedLabels.every((label) => ['lesson title', 'duration'].includes(label))).toBe(true);
    expect(isMeaningfulFill(titleOnly.filledCount, titleOnly.matchedLabels)).toBe(false);
  });

  it('does not write into a narrow Time tracking column next to a label', async () => {
    const templateXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:tbl>
      <w:tr>
        <w:tc><w:tcPr><w:tcW w:w="6000" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>Activities</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="1038" w:type="dxa"/></w:tcPr><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
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

    expect(result.matchedLabels).toContain('activities');
    expect(outXml).toContain('Model particle diagrams');
    expect(outXml).toMatch(/<w:tcW w:w="1038"[\s\S]*?<\/w:tc>/);
    const timeCell = outXml.match(/<w:tcW w:w="1038"[\s\S]*?<\/w:tc>/)?.[0] ?? '';
    expect(timeCell).not.toContain('Model particle diagrams');
  });

  it('fills the Mom-style blank Daily English lesson plan template body fields', async () => {
    const templateBuffer = readFileSync(
      join(__dirname, '../../../fixtures/blank-daily-english-lesson-plan.docx'),
    );
    const result = await fillGenericDocxTemplate(templateBuffer, sampleLesson);
    const JSZip = (await import('jszip')).default;
    const outZip = await JSZip.loadAsync(result.buffer);
    const outXml = await outZip.file('word/document.xml')!.async('string');

    expect(isMeaningfulFill(result.filledCount, result.matchedLabels)).toBe(true);
    expect(result.matchedLabels).toEqual(
      expect.arrayContaining(['lesson title', 'duration', 'learning objectives', 'essential questions']),
    );
    expect(outXml).toContain('How do changes in thermal energy affect the state of matter?');
    expect(outXml).toContain('Students will develop a model that predicts and describes changes in particle motion');
    expect(outXml).toContain('Phase — a distinct form of matter');
    expect(outXml).toContain('Model particle diagrams');
    expect(outXml).not.toContain('Visual media in the UAE');
    expect(outXml).not.toContain('Couch potato');
  });
});
