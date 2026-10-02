import { readFileSync } from 'fs';
import { join } from 'path';
import { TextEncoder, TextDecoder } from 'util';
import {
  buildFieldMap,
  fillGenericDocxTemplate,
  getCheckboxSelections,
  highlightCheckboxCell,
  normalizeLabel,
  cellPlainText,
} from '@/lib/export/fill-generic-template';
import { isMeaningfulFill } from '@/lib/export/fill-template-result';
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

function rowCells(xml: string): string[][] {
  return topLevelXml(xml, 'w:tbl').flatMap((tbl) =>
    topLevelXml(tbl, 'w:tr').map((row) => topLevelXml(row, 'w:tc').map((cell) => cellPlainText(cell))),
  );
}

function valueCellXmlForLabel(xml: string, label: string): string | undefined {
  const needle = label.toLowerCase();
  for (const tbl of topLevelXml(xml, 'w:tbl')) {
    for (const row of topLevelXml(tbl, 'w:tr')) {
      const cells = topLevelXml(row, 'w:tc');
      if (cells.length < 2) continue;
      if (cellPlainText(cells[0]).toLowerCase().includes(needle)) return cells[1];
    }
  }
  return undefined;
}

async function fillXml(templateXml: string, lesson: LessonPlan = sampleLesson) {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  zip.file('word/document.xml', templateXml);
  zip.file(
    '[Content_Types].xml',
    '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>',
  );
  const templateBuffer = Buffer.from(await zip.generateAsync({ type: 'nodebuffer' }));
  const result = await fillGenericDocxTemplate(templateBuffer, lesson);
  const outZip = await JSZip.loadAsync(result.buffer);
  const outXml = await outZip.file('word/document.xml')!.async('string');
  return { result, outXml };
}

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
    guidedPractice: [
      'Time: 15 min\nTeacher Activity: Circulate and prompt particle comparisons\nLearner Activity & Success Criteria: Complete practice diagrams\nFormative Assessment: Spot checks\nResources: Practice sheet',
    ],
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

    const activityRow = rowCells(outXml).find((cells) =>
      cells[1]?.includes('Activation (Introducing New Content)'),
    );
    const demoRow = rowCells(outXml).find((cells) =>
      cells[1]?.includes('Demonstration of Learning'),
    );
    expect(activityRow).toBeDefined();
    expect(demoRow).toBeDefined();
    expect(activityRow![1]).toContain('Model particle diagrams');
    expect(activityRow![2]).toContain('Draw models');
    expect(activityRow![2]).not.toMatch(/Teacher Activity:/i);
    expect(activityRow![3]).toContain('Gallery walk');
    expect(activityRow![4]).toContain('Whiteboard');
    expect(demoRow![1]).toContain('Circulate and prompt particle comparisons');
    expect(demoRow![1]).not.toContain('Model particle diagrams');
    expect(`${activityRow![1]} ${activityRow![2]} ${activityRow![3]}`).not.toMatch(
      /Time:[\s\S]*Teacher Activity:[\s\S]*Learner Activity[\s\S]*Formative Assessment:/i,
    );

    const adaptive = valueCellXmlForLabel(outXml, 'Adaptive Teaching / Differentiation') ?? '';
    const adaptiveText = cellPlainText(adaptive);
    const priorIdx = adaptiveText.indexOf('Prior knowledge:');
    const particlesIdx = adaptiveText.indexOf('particles that are constantly in motion');
    const towardsIdx = adaptiveText.indexOf('Working Towards Mastery');
    const supportIdx = adaptiveText.indexOf('Provide annotated particle diagrams');
    const depthIdx = adaptiveText.indexOf('Mastery with Greater Depth');
    const extensionIdx = adaptiveText.indexOf('Research sublimation examples');
    const senIdx = adaptiveText.indexOf('Special Educational Needs');
    expect(particlesIdx).toBeGreaterThan(priorIdx);
    expect(particlesIdx).toBeLessThan(towardsIdx);
    expect(supportIdx).toBeGreaterThan(towardsIdx);
    expect(supportIdx).toBeLessThan(senIdx);
    expect(extensionIdx).toBeGreaterThan(depthIdx);
    expect(extensionIdx).toBeLessThan(senIdx);

    const skills = valueCellXmlForLabel(outXml, 'Targeted Learning Skills') ?? '';
    const strategies = valueCellXmlForLabel(outXml, 'Teaching Strategies') ?? '';
    const assessment = valueCellXmlForLabel(outXml, 'Formative Assessment Methods') ?? '';
    const seating = valueCellXmlForLabel(outXml, 'Seating Arrangements') ?? '';
    const digital = valueCellXmlForLabel(outXml, 'Digital Pedagogy') ?? '';
    expect(skills).toMatch(/w14:checked w14:val="1"/);
    expect(strategies).toMatch(/w14:checked w14:val="1"/);
    expect(assessment).toMatch(/w14:checked w14:val="1"/);
    expect(seating).toMatch(/w14:checked w14:val="1"/);
    expect(seating).toContain('\u2612');
    expect(digital).toMatch(/w14:checked w14:val="1"/);
  });

  it('writes activity columns per phase instead of dumping the blob into one cell', async () => {
    const templateXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:tbl>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Time</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Teacher activity</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Learner activity &amp; Success Criteria</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Formative assessment</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Learning materials /resources</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>How are you unpacking, modelling, explaining?</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>What are the learners doing</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>How are you assessing</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Manipulatives</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Do Now (Starter Activity)</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Activation (Introducing New Content)</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Demonstration of Learning (Practice)</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
      </w:tr>
    </w:tbl>
  </w:body>
</w:document>`;

    const { outXml } = await fillXml(templateXml);
    const rows = rowCells(outXml);
    const doNow = rows.find((cells) => cells[1]?.includes('Do Now (Starter Activity)'));
    const activation = rows.find((cells) => cells[1]?.includes('Activation (Introducing New Content)'));
    const demo = rows.find((cells) => cells[1]?.includes('Demonstration of Learning'));
    expect(doNow?.[1]).toContain('Demo ice melting');
    expect(doNow?.[2]).toContain('Observe and predict');
    expect(doNow?.[3]).toContain('Pair share');
    expect(activation?.[0]).toContain('20 min');
    expect(activation?.[1]).toContain('Model particle diagrams');
    expect(activation?.[2]).toContain('Draw models');
    expect(activation?.[2]).not.toMatch(/Teacher Activity:/);
    expect(activation?.[3]).toContain('Gallery walk');
    expect(activation?.[4]).toContain('Whiteboard');
    expect(demo?.[1]).toContain('Circulate and prompt particle comparisons');
    expect(demo?.[1]).not.toContain('Model particle diagrams');
    expect(demo?.[2]).toContain('Complete practice diagrams');
  });

  it('places differentiation bullets under matching Adaptive Teaching headings', async () => {
    const templateXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:tbl>
      <w:tr>
        <w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>Adaptive Teaching / Differentiation</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="9000" w:type="dxa"/></w:tcPr>
          <w:p><w:r><w:t>Prior knowledge:</w:t></w:r></w:p>
          <w:p><w:r><w:t></w:t></w:r></w:p>
          <w:p><w:r><w:t>Working Towards Mastery (all):</w:t></w:r></w:p>
          <w:p><w:r><w:t></w:t></w:r></w:p>
          <w:p><w:r><w:t>Working At Mastery (most):</w:t></w:r></w:p>
          <w:p><w:r><w:t></w:t></w:r></w:p>
          <w:p><w:r><w:t>Mastery with Greater Depth (some):</w:t></w:r></w:p>
          <w:p><w:r><w:t></w:t></w:r></w:p>
          <w:p><w:r><w:t>Other adaptive teaching strategies:</w:t></w:r></w:p>
          <w:p><w:r><w:t></w:t></w:r></w:p>
          <w:p><w:r><w:t>Special Educational Needs (SEN registered), Learning Support (LS), Gifted &amp; Talented (G&amp;T):</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
    </w:tbl>
  </w:body>
</w:document>`;

    const { outXml } = await fillXml(templateXml);
    const adaptive = cellPlainText(valueCellXmlForLabel(outXml, 'Adaptive Teaching / Differentiation') ?? '');
    const priorIdx = adaptive.indexOf('Prior knowledge:');
    const particlesIdx = adaptive.indexOf('particles that are constantly in motion');
    const towardsIdx = adaptive.indexOf('Working Towards Mastery');
    const supportIdx = adaptive.indexOf('Provide annotated particle diagrams');
    const senIdx = adaptive.indexOf('Special Educational Needs');
    expect(particlesIdx).toBeGreaterThan(priorIdx);
    expect(particlesIdx).toBeLessThan(towardsIdx);
    expect(supportIdx).toBeGreaterThan(towardsIdx);
    expect(supportIdx).toBeLessThan(senIdx);
    expect(adaptive.indexOf('I can explain how particle motion')).toBeGreaterThan(
      adaptive.indexOf('Working At Mastery'),
    );
    expect(adaptive.indexOf('Research sublimation examples')).toBeGreaterThan(
      adaptive.indexOf('Mastery with Greater Depth'),
    );
  });

  it('checks Word checkbox SDTs and seating boxes for Formal categories', async () => {
    const box = (label: string) =>
      `<w:p><w:sdt><w:sdtPr><w14:checkbox><w14:checked w14:val="0"/><w14:checkedState w14:val="2612" w14:font="MS Gothic"/><w14:uncheckedState w14:val="2610" w14:font="MS Gothic"/></w14:checkbox></w:sdtPr><w:sdtContent><w:r><w:t>\u2610</w:t></w:r></w:sdtContent></w:sdt><w:r><w:t xml:space="preserve"> ${label}</w:t></w:r></w:p>`;

    const templateXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml">
  <w:body>
    <w:tbl>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Teaching Strategies</w:t></w:r></w:p></w:tc>
        <w:tc>
          <w:p><w:r><w:t>Please highlight all that apply:</w:t></w:r></w:p>
          ${box('Scaffolding')}
          ${box('Differentiated Learning')}
          ${box('Group Work')}
        </w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Seating Arrangements</w:t></w:r></w:p></w:tc>
        <w:tc>
          <w:p><w:r><w:t>Please highlight all that apply:</w:t></w:r></w:p>
          ${box('Individual')}
          ${box('Pairs')}
          ${box('Groups (mixed levels)')}
        </w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Formative Assessment Methods</w:t></w:r></w:p></w:tc>
        <w:tc>
          <w:p><w:r><w:t>Please highlight all that apply:</w:t></w:r></w:p>
          ${box('Exit Tickets')}
          ${box('Quiz')}
        </w:tc>
      </w:tr>
    </w:tbl>
  </w:body>
</w:document>`;

    const { outXml } = await fillXml(templateXml);
    const strategies = valueCellXmlForLabel(outXml, 'Teaching Strategies') ?? '';
    const seating = valueCellXmlForLabel(outXml, 'Seating Arrangements') ?? '';
    const assessment = valueCellXmlForLabel(outXml, 'Formative Assessment Methods') ?? '';
    expect(strategies).toMatch(/w14:checked w14:val="1"/);
    expect(seating).toMatch(/w14:checked w14:val="1"/);
    expect(seating).toContain('\u2612');
    expect(assessment).toMatch(/w14:checked w14:val="1"/);
    expect(getCheckboxSelections(normalizeLabel('Targeted Learning Skills'), sampleLesson)?.length).toBeGreaterThan(
      0,
    );
  });
});
