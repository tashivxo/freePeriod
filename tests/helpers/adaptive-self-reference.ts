import type { LessonPlan } from '@/types';

export const SELF_POINTER_TOWARDS = 'See Adaptive Teaching: Working Towards Mastery.';
export const SELF_POINTER_AT = 'See Adaptive Teaching: Working At Mastery.';
export const SELF_POINTER_DEPTH = 'See Adaptive Teaching: Mastery with Greater Depth.';

export const SELF_POINTERS = [SELF_POINTER_TOWARDS, SELF_POINTER_AT, SELF_POINTER_DEPTH] as const;

export const REAL_SUCCESS_AT = 'I can explain why modal verbs show obligation.';
export const REAL_SUPPORT = 'Provide a bilingual glossary for the target verbs.';
export const REAL_EXTENSION = 'Compare must and have to in a formal letter.';

/**
 * One lesson whose Working At Mastery, Working Towards Mastery, and Mastery with Greater
 * Depth lists each contain a line that only points back at itself. Every surface that can
 * show those lists (in-app view, DOCX export, PDF fields, template fill) shares it.
 */
export const selfReferentialLesson: LessonPlan = {
  id: 'self-ref',
  user_id: 'user-id',
  title: 'Ocean conservation: modal verbs',
  subject: 'English',
  grade: '6',
  curriculum: 'UK',
  duration_minutes: 60,
  model_used: 'test',
  token_count: 0,
  template_path: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  content: {
    title: 'Ocean conservation: modal verbs',
    essentialQuestion: 'Why must we protect the ocean?',
    objectives: ['Students will use must and have to correctly.'],
    successCriteria: [REAL_SUCCESS_AT, SELF_POINTER_AT],
    priorKnowledge: ['Students know basic conservation vocabulary.'],
    keyConcepts: ['Modal verbs express obligation'],
    vocabulary: ['must', 'have to'],
    hook: 'Time: 5 min\nTeacher Activity: hook\nLearner Activity & Success Criteria: watch\nResources: video',
    mainActivities: [
      [
        'Time: 20 min',
        'Teacher Activity: Model sentences with must and have to',
        'Learner Activity & Success Criteria: Sort sentences by obligation type',
        'Formative Assessment: Gallery walk',
        'Resources: Sentence strips',
      ].join('\n'),
    ],
    guidedPractice: [
      [
        'Time: 10 min',
        'Teacher Activity: Circulate and prompt',
        'Learner Activity & Success Criteria: Complete the paired cloze task',
        'Formative Assessment: Spot checks',
        'Resources: Cloze sheet',
      ].join('\n'),
    ],
    independentPractice: [
      [
        'Time: 10 min',
        'Teacher Activity: Hand out the on-level task',
        'Learner Activity & Success Criteria: Write four sentences about ocean rules',
        'Formative Assessment: Check the first two sentences',
        'Resources: Lined paper',
      ].join('\n'),
    ],
    formativeAssessment: ['Exit ticket'],
    differentiation: {
      support: [REAL_SUPPORT, SELF_POINTER_TOWARDS],
      extension: [REAL_EXTENSION, SELF_POINTER_DEPTH],
    },
    realWorldConnections: [],
    plenary: [
      'Time: 5 min',
      'Teacher Activity: Summarise the rules',
      'Learner Activity & Success Criteria: Share one sentence',
      'Formative Assessment: Thumbs up or down',
      'Resources: Notebook',
    ].join('\n'),
  },
};

export function lessonWithSelfPointerStrategy(strategy: string): LessonPlan {
  return {
    ...selfReferentialLesson,
    content: {
      ...selfReferentialLesson.content,
      templateSlots: { activityExpected: strategy },
    },
  };
}
