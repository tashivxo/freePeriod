import { TextEncoder, TextDecoder } from 'util';
import { generateDocx, parseActivityBlock, formatCheckboxItems, inferTeachingStrategies } from '@/lib/export/docx';
import type { LessonPlan } from '@/types';

Object.assign(globalThis, { TextEncoder, TextDecoder });

const sampleLesson: LessonPlan = {
  id: 'test-id',
  user_id: 'user-id',
  title: 'Exploring Energy Transformations',
  subject: 'Science',
  grade: '9',
  curriculum: 'IB',
  duration_minutes: 60,
  model_used: 'test',
  token_count: 0,
  template_path: null,
  created_at: '',
  updated_at: '',
  content: {
    title: 'Exploring Energy Transformations and Conservation',
    essentialQuestion: 'How is energy transformed and conserved within various systems?',
    objectives: [
      'Students will analyze energy transformations in everyday scenarios.',
      'Students will evaluate the efficiency of energy conversion processes.',
    ],
    successCriteria: ['Students can identify five forms of energy', 'Students can explain conservation of energy'],
    keyConcepts: ['Energy Forms', 'Energy Transformation', 'Conservation of Energy'],
    vocabulary: ['Kinetic Energy', 'Potential Energy', 'Efficiency'],
    hook: '5 min starter: Show a roller coaster clip and ask students to predict energy changes.',
    mainActivities: [
      '**1. Introduction to Energy Forms (10 minutes)**\n*Teacher Action:* Present an interactive slideshow.\n*Student Action:* Take notes and give examples.\n*Resources:* Projector, slideshow.\n*Checks for Understanding:* Thumbs up/down checks.',
      '**2. Energy Transformation Scenarios (15 minutes)**\n*Teacher Action:* Facilitate group analysis.\n*Student Action:* Complete graphic organizers.\n*Resources:* Scenario cards.\n*Checks for Understanding:* Circulate and probe reasoning.',
    ],
    guidedPractice: [
      '*Teacher Action:* Distribute a transformations worksheet.\n*Student Action:* Complete scenarios independently.\n*Resources:* Worksheet.\n*Checks for Understanding:* Review responses.',
    ],
    independentPractice: [
      '*Task:* Design an energy transformation diagram for a household appliance.\n*Expected Output:* Labelled diagram with at least four transformations.',
    ],
    formativeAssessment: ['Exit ticket', 'Observations during group work', 'Worksheet review'],
    differentiation: {
      support: ['Provide a word bank and partially completed organizer.'],
      extension: ['Research real-world efficiency improvements.'],
    },
    realWorldConnections: ['Household appliances', 'Transportation systems'],
    plenary: 'Students share one sentence summarizing the most important learning from today.',
  },
};

describe('docx export', () => {
  it('parses structured activity blocks into table columns', () => {
    const parsed = parseActivityBlock(sampleLesson.content.mainActivities[0], '5 min');

    expect(parsed.time).toBe('10 minutes');
    expect(parsed.teacher).toContain('interactive slideshow');
    expect(parsed.learner).toContain('Take notes');
    expect(parsed.resources).toContain('Projector');
    expect(parsed.assessment).toContain('Thumbs up/down');
  });

  it('formats checkbox lists for planning rows', () => {
    const formatted = formatCheckboxItems(['Exit ticket', 'Observations', 'Peer review'], 2);
    expect(formatted).toContain('✓ Exit ticket');
    expect(formatted).toContain('✓ Observations');
  });

  it('infers teaching strategies from lesson content', () => {
    const strategies = inferTeachingStrategies(sampleLesson.content);
    expect(strategies.length).toBeGreaterThan(0);
  });

  it('generates a non-empty DOCX buffer with table-based layout', async () => {
    const buffer = await generateDocx(sampleLesson);
    expect(buffer.length).toBeGreaterThan(5000);
    expect(buffer.subarray(0, 2).toString()).toBe('PK');
  });
});
