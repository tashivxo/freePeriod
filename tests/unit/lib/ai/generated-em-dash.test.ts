import {
  buildSystemPrompt,
  parseLessonContent,
} from '@/lib/ai/claude';
import {
  buildPlanningFieldsRetryPrompt,
  enrichThinLessonContent,
} from '@/lib/ai/lesson-content-quality';
import type { LessonSection } from '@/types';

const EM_DASH = '\u2014';

const thinLesson: LessonSection = {
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
  hook: 'Time: 5 min\nTeacher Activity: Demo',
  mainActivities: ['Time: 15 min\nTeacher Activity: Stations'],
  guidedPractice: [],
  independentPractice: [],
  formativeAssessment: ['Exit ticket'],
  differentiation: { support: ['Visual aids'], extension: ['Research plasma'] },
  realWorldConnections: ['Weather'],
  plenary: 'Time: 5 min\nTeacher Activity: Summarize',
};

function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(collectStrings);
  }
  return [];
}

describe('generated lesson copy has no em dash (U+2014)', () => {
  it('keeps U+2014 out of Claude and Gemini system prompt instructions', () => {
    const prompts = [
      buildSystemPrompt(),
      buildSystemPrompt('ar'),
      buildSystemPrompt('es'),
      buildSystemPrompt('fr'),
      buildSystemPrompt('zh-Hans'),
    ];

    for (const prompt of prompts) {
      expect(prompt).toContain('Term: student-friendly definition');
      expect(prompt).not.toContain(EM_DASH);
    }
  });

  it('keeps U+2014 out of planning-field fallback content and retry examples', () => {
    const { content } = enrichThinLessonContent(thinLesson, thinLesson.title);
    const retryPrompt = buildPlanningFieldsRetryPrompt(
      ['misconceptions', 'keyConcepts', 'vocabulary'],
      thinLesson,
    );

    const offenders = [...collectStrings(content), retryPrompt].filter((text) =>
      text.includes(EM_DASH),
    );

    expect(offenders).toEqual([]);
  });

  it('replaces generated em dashes after parse and leaves a user-supplied title unchanged', () => {
    const userTitle = 'Story Elements — plot, character, and theme';
    const parsed = parseLessonContent(
      JSON.stringify({
        title: userTitle,
        objectives: ['Identify story elements'],
        vocabulary: ['Phase — a distinct form of matter such as solid, liquid, or gas'],
        keyConcepts: [
          'Particle motion — particles move faster when thermal energy increases',
        ],
        misconceptions: [
          'Students often think particles stop moving in solids — addressed by comparing vibration models.',
        ],
        hook: 'Show a short clip — then ask a prediction question',
      }),
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.title).toBe(userTitle);
    expect(parsed?.title).toContain(EM_DASH);
    expect(parsed?.vocabulary).toEqual([
      'Phase: a distinct form of matter such as solid, liquid, or gas',
    ]);
    expect(parsed?.keyConcepts).toEqual([
      'Particle motion: particles move faster when thermal energy increases',
    ]);
    expect(parsed?.misconceptions).toEqual([
      'Students often think particles stop moving in solids, addressed by comparing vibration models.',
    ]);
    expect(parsed?.hook).toBe('Show a short clip, then ask a prediction question');
    expect(collectStrings({ ...parsed, title: '' }).join('')).not.toContain(EM_DASH);
  });
});
