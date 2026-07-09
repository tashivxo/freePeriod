import { buildSystemPrompt, parseLessonContent } from './claude';

describe('Claude lesson prompt parsing', () => {
  it('parses formal lesson planning fields from model JSON', () => {
    const lesson = parseLessonContent(JSON.stringify({
      title: 'Elements of a Story',
      essentialQuestion: 'How do authors use story elements to create meaning?',
      objectives: ['Identify story elements', 'Explain their purpose'],
      successCriteria: ['I can label story elements'],
      priorKnowledge: [
        'Students should already know that stories have characters and settings.',
        'Students should be familiar with reading short fiction texts independently.',
      ],
      performanceExpectations: [
        'RL.5.3: Compare and contrast two or more characters in a story, drawing on specific details from the text.',
      ],
      misconceptions: [
        'Students often think the setting is only the place — addressed by discussing time period and mood as part of setting.',
      ],
      sciencePractices: ['Analyzing and interpreting data from literary texts'],
      keyConcepts: ['Character — the people or beings who drive the plot through their actions and dialogue'],
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
    expect(lesson?.priorKnowledge).toHaveLength(2);
    expect(lesson?.performanceExpectations?.[0]).toContain('RL.5.3');
    expect(lesson?.vocabulary).toEqual(['conflict', 'theme', 'resolution']);
  });

  it('asks the model for substantive planning-field content', () => {
    const prompt = buildSystemPrompt();

    expect(prompt).toContain('essentialQuestion');
    expect(prompt).toContain('priorKnowledge');
    expect(prompt).toContain('performanceExpectations');
    expect(prompt).toContain('vocabulary');
    expect(prompt).toContain('formal observation');
    expect(prompt).toContain('Learner Activity & Success Criteria');
    expect(prompt).toContain('Plain text only');
    expect(prompt).toContain('not skeleton outlines');
    expect(prompt).toContain('Term — student-friendly definition');
    expect(prompt).toContain('FORMAT EXAMPLES');
  });

  it('keeps curriculum guidance neutral across standards', () => {
    const prompt = buildSystemPrompt();

    expect(prompt).toContain('selected curriculum');
    expect(prompt).toContain('CAPS');
    expect(prompt).toContain('GCSE');
    expect(prompt).not.toContain('UAE/MOE');
  });
});
