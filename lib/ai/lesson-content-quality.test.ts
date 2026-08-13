import {
  enrichThinLessonContent,
  getLessonContentValidationFailures,
  isRichExplanationList,
  mergePlanningFieldRetry,
  sanitizeCurriculumIdentifiers,
  sanitizeLessonCurriculumIdentifiers,
} from './lesson-content-quality';
import type { LessonSection } from '@/types';

const thinContent: LessonSection = {
  title: 'Exploring States of Matter',
  essentialQuestion: 'What are solids, liquids, and gases?',
  objectives: ['Students will identify the three states of matter.'],
  successCriteria: ['I can identify solids, liquids, and gases'],
  priorKnowledge: [],
  performanceExpectations: [],
  misconceptions: [],
  sciencePractices: [],
  keyConcepts: ['Matter', 'Solid', 'Liquid'],
  vocabulary: ['Solid', 'Liquid', 'Gas'],
  hook: 'Time: 5 min\nTeacher Activity: Demo\nLearner Activity & Success Criteria: Observe\nFormative Assessment: Questioning\nResources: Beaker',
  mainActivities: [
    'Time: 15 min\nTeacher Activity: Station rotation\nLearner Activity & Success Criteria: Observe materials\nFormative Assessment: Sheet review\nResources: Stations',
  ],
  guidedPractice: [],
  independentPractice: [],
  formativeAssessment: ['Exit ticket'],
  differentiation: { support: ['Visual aids'], extension: ['Research plasma'] },
  realWorldConnections: ['Weather and the water cycle'],
  plenary: 'Time: 5 min\nTeacher Activity: Summarize\nLearner Activity & Success Criteria: Share learning\nFormative Assessment: Thumbs\nResources: Notebook',
};

describe('lesson-content-quality', () => {
  it('flags thin planning fields', () => {
    const failures = getLessonContentValidationFailures(thinContent);

    expect(failures).toEqual(
      expect.arrayContaining([
        'priorKnowledge',
        'performanceExpectations',
        'misconceptions',
        'sciencePractices',
        'keyConcepts',
        'vocabulary',
      ]),
    );
  });

  it('merges retry patches into the base lesson content', () => {
    const merged = mergePlanningFieldRetry(thinContent, {
      priorKnowledge: [
        'Students should already understand that materials can be observed in everyday objects.',
        'Students should be able to compare properties such as shape and volume in simple investigations.',
      ],
    });

    expect(merged.priorKnowledge).toHaveLength(2);
    expect(merged.keyConcepts).toEqual(thinContent.keyConcepts);
  });

  it('enriches thin fields with substantive fallback content', () => {
    const { content, enrichedFields } = enrichThinLessonContent(thinContent, thinContent.title);

    expect(enrichedFields.length).toBeGreaterThan(0);
    expect(content.priorKnowledge?.every((item) => item.length >= 40)).toBe(true);
    expect(content.performanceExpectations?.[0]).not.toMatch(/\bPE-\d+\b/);
    expect(content.sciencePractices?.join(' ')).not.toMatch(
      /Developing and using|Planning and carrying out|Analyzing and interpreting|Constructing explanations|Asking focused questions and identifying problems/i,
    );
    expect(isRichExplanationList(content.keyConcepts)).toBe(true);
    expect(isRichExplanationList(content.vocabulary)).toBe(true);
  });

  it('keeps only identifiers found in the uploaded curriculum document', () => {
    const sanitized = sanitizeCurriculumIdentifiers(
      [
        'RL.5.3: Compare characters using details from the text.',
        'MS-PS1-4: Explain particle motion using a model.',
        '5-PS1-1: Develop a model of matter.',
      ],
      'The relevant standard is RL.5.3 and 5-PS1-1.',
    );

    expect(sanitized).toEqual([
      'RL.5.3: Compare characters using details from the text.',
      'Explain particle motion using a model.',
      '5-PS1-1: Develop a model of matter.',
    ]);
  });

  it('keeps Common Core dotted codes that appear in the curriculum document', () => {
    expect(
      sanitizeCurriculumIdentifiers(
        ['5.NBT.3: Read, write, and compare decimals.'],
        'Number and Operations in Base Ten 5.NBT.3',
      ),
    ).toEqual(['5.NBT.3: Read, write, and compare decimals.']);
  });

  it('strips Common Core dotted codes that were not in the curriculum document', () => {
    expect(
      sanitizeCurriculumIdentifiers(['5.NBT.3: Read, write, and compare decimals.']),
    ).toEqual(['Read, write, and compare decimals.']);
    expect(
      sanitizeCurriculumIdentifiers(['6.EE.A.1: Write and evaluate numerical expressions.']),
    ).toEqual(['Write and evaluate numerical expressions.']);
  });

  it('matches grade-band NGSS codes in full', () => {
    expect(
      sanitizeCurriculumIdentifiers(
        ['3-5-ETS1-1: Define a simple design problem.', 'K-2-ETS1-1: Ask questions about a problem.'],
        'Standards 3-5-ETS1-1 and K-2-ETS1-1',
      ),
    ).toEqual([
      '3-5-ETS1-1: Define a simple design problem.',
      'K-2-ETS1-1: Ask questions about a problem.',
    ]);
    expect(
      sanitizeCurriculumIdentifiers(['3-5-ETS1-1: Define a simple design problem.']),
    ).toEqual(['Define a simple design problem.']);
    expect(
      sanitizeCurriculumIdentifiers(['K-2-ETS1-1: Ask questions about a problem.']),
    ).toEqual(['Ask questions about a problem.']);
  });

  it('removes PE-style prefixes before a colon or em dash when no document was uploaded', () => {
    expect(
      sanitizeCurriculumIdentifiers(['PE-1: Students explain the target concept.']),
    ).toEqual(['Students explain the target concept.']);
    expect(
      sanitizeCurriculumIdentifiers(['PE-1 — Students explain the target concept.']),
    ).toEqual(['Students explain the target concept.']);
  });

  it('does not strip ordinary scientific terms or date ranges', () => {
    expect(
      sanitizeCurriculumIdentifiers(['Compare CO2 and SO2 emissions in K-12 settings during COVID-19.']),
    ).toEqual(['Compare CO2 and SO2 emissions in K-12 settings during COVID-19.']);
    expect(
      sanitizeCurriculumIdentifiers(['Compare AO1 evidence with classroom observations.']),
    ).toEqual(['Compare AO1 evidence with classroom observations.']);
  });

  it('does not treat caption, acronym, or question labels as standards codes', () => {
    expect(
      sanitizeCurriculumIdentifiers([
        'COVID-19: review safety notes.',
        'Year-12: exam preparation.',
        'See Fig.1.2 and U.S.A. in Q.1.a.',
      ]),
    ).toEqual([
      'COVID-19: review safety notes.',
      'Year-12: exam preparation.',
      'See Fig.1.2 and U.S.A. in Q.1.a.',
    ]);
  });

  it('filters empty strings after sanitizing list fields', () => {
    expect(sanitizeCurriculumIdentifiers(['PE-1: ', '', '  '])).toEqual([]);

    const sanitized = sanitizeLessonCurriculumIdentifiers({
      ...thinContent,
      objectives: ['PE-1: ', 'Students will explain the target concept.', ''],
      keyConcepts: ['MS-PS1-4'],
    });

    expect(sanitized.objectives).toEqual(['Students will explain the target concept.']);
    expect(sanitized.keyConcepts).toEqual([]);
  });

  it('sanitizes unsupported identifiers across the lesson content', () => {
    const sanitized = sanitizeLessonCurriculumIdentifiers(
      {
        ...thinContent,
        objectives: ['Students will apply MS-PS1-4 to explain the topic.'],
        keyConcepts: ['RL.5.3 — a code that should not appear here'],
        hook: 'Use MS-PS1-4 to begin the lesson.',
        differentiation: {
          support: ['Use a visual model.'],
          extension: ['Compare AO1 evidence.'],
        },
      },
      'The selected document contains general curriculum guidance only.',
    );

    expect(sanitized.objectives[0]).not.toContain('MS-PS1-4');
    expect(sanitized.keyConcepts[0]).not.toContain('RL.5.3');
    expect(sanitized.hook).not.toContain('MS-PS1-4');
    expect(sanitized.differentiation.extension[0]).toContain('AO1');
  });
});
