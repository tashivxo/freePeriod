import {
  enrichThinLessonContent,
  getLessonContentValidationFailures,
  isRichExplanationList,
  mergePlanningFieldRetry,
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
    expect(content.performanceExpectations?.[0]).toContain('PE-1');
    expect(isRichExplanationList(content.keyConcepts)).toBe(true);
    expect(isRichExplanationList(content.vocabulary)).toBe(true);
  });
});
