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
    expect(isRichExplanationList(content.keyConcepts)).toBe(true);
    expect(isRichExplanationList(content.vocabulary)).toBe(true);
  });

  it('keeps only identifiers found in the uploaded curriculum document', () => {
    const sanitized = sanitizeCurriculumIdentifiers(
      [
        'RL.5.3: Compare characters using details from the text.',
        'MS-PS1-4: Explain particle motion using a model.',
      ],
      'The relevant standard is RL.5.3 and its associated learning outcome.',
    );

    expect(sanitized).toEqual([
      'RL.5.3: Compare characters using details from the text.',
      'Explain particle motion using a model.',
    ]);
  });

  it('removes code-shaped identifiers when no curriculum document was uploaded', () => {
    expect(
      sanitizeCurriculumIdentifiers(['PE-1: Students explain the target concept.']),
    ).toEqual(['Students explain the target concept.']);
  });

  it('does not strip ordinary scientific terms or date ranges', () => {
    expect(
      sanitizeCurriculumIdentifiers(['Compare CO2 and SO2 emissions in K-12 settings during COVID-19.']),
    ).toEqual(['Compare CO2 and SO2 emissions in K-12 settings during COVID-19.']);
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
