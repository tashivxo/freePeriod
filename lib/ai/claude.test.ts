import { buildSystemPrompt, parseLessonContent } from './claude';

describe('Claude lesson prompt parsing', () => {
  it('parses formal lesson planning fields from model JSON', () => {
    const lesson = parseLessonContent(JSON.stringify({
      title: 'Elements of a Story',
      essentialQuestion: 'How do authors use story elements to create meaning?',
      objectives: ['Identify story elements', 'Explain their purpose'],
      successCriteria: ['I can label story elements'],
      keyConcepts: ['character', 'setting'],
      vocabulary: ['conflict', 'theme', 'resolution'],
      hook: 'Show a short story excerpt.',
      mainActivities: ['Model analysis', 'Group annotation'],
      guidedPractice: ['Complete a shared story map'],
      independentPractice: ['Analyze a new text'],
      formativeAssessment: ['Exit ticket'],
      differentiation: {
        support: ['Provide sentence starters'],
        extension: ['Analyze implicit theme'],
      },
      realWorldConnections: ['Connect story structure to films'],
      plenary: 'Students share one story element.',
    }));

    expect(lesson).not.toBeNull();
    expect(lesson?.essentialQuestion).toBe('How do authors use story elements to create meaning?');
    expect(lesson?.vocabulary).toEqual(['conflict', 'theme', 'resolution']);
  });

  it('asks the model for observation-ready lesson plan details', () => {
    const prompt = buildSystemPrompt();

    expect(prompt).toContain('essentialQuestion');
    expect(prompt).toContain('vocabulary');
    expect(prompt).toContain('formal observation');
    expect(prompt).toContain('Learner Activity & Success Criteria');
    expect(prompt).toContain('Plain text only');
    expect(prompt).toContain('2 to 4 short bullet points');
  });

  it('keeps curriculum guidance neutral across standards', () => {
    const prompt = buildSystemPrompt();

    expect(prompt).toContain('selected curriculum');
    expect(prompt).toContain('CAPS');
    expect(prompt).toContain('GCSE');
    expect(prompt).not.toContain('UAE/MOE');
  });
});
