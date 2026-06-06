import { TextEncoder, TextDecoder } from 'util';
import { generateDocx, parseActivityBlock, formatCheckboxItems, inferTeachingStrategies } from '@/lib/export/docx';
import type { LessonPlan } from '@/types';

Object.assign(globalThis, { TextEncoder, TextDecoder });

const structuredActivity = [
  'Time: 10 min',
  'Teacher Activity: Present interactive slideshow on energy forms',
  'Model one example transformation on the board',
  'Learner Activity & Success Criteria: Take notes and give examples in pairs',
  'I can: identify five forms of energy in everyday scenarios',
  'I can: describe one energy transformation with correct labels',
  'Formative Assessment: Thumbs up/down after each example',
  'Cold-call two pairs to share',
  'Resources: Projector, slideshow, pupil notebooks, whiteboard',
].join('\n');

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
    successCriteria: [
      'I can identify five forms of energy',
      'I can explain conservation of energy in a closed system',
    ],
    keyConcepts: ['Energy Forms', 'Energy Transformation', 'Conservation of Energy'],
    vocabulary: ['Kinetic Energy', 'Potential Energy', 'Efficiency'],
    hook: [
      'Time: 5 min',
      'Teacher Activity: Show roller coaster clip and pose prediction question',
      'Learner Activity & Success Criteria: Predict energy changes in pairs',
      'I can: name the energy form at the top and bottom of the track',
      'Formative Assessment: Listen to pair predictions during turn-and-talk',
      'Resources: Projector, video clip, pupil notebooks',
    ].join('\n'),
    mainActivities: [
      structuredActivity,
      [
        'Time: 15 min',
        'Teacher Activity: Facilitate group analysis of scenario cards',
        'Circulate and probe reasoning with open questions',
        'Learner Activity & Success Criteria: Complete graphic organisers in groups of four',
        'I can: map energy transfers on a scenario diagram',
        'I can: justify whether energy is conserved in the scenario',
        'Formative Assessment: Circulate checklist during group work',
        'Spot-check one group per table',
        'Resources: Scenario cards, graphic organisers, whiteboard markers',
      ].join('\n'),
    ],
    guidedPractice: [
      [
        'Time: 10 min',
        'Teacher Activity: Distribute transformations worksheet and model first item',
        'Learner Activity & Success Criteria: Complete remaining items with teacher support',
        'I can: label inputs and outputs for each transformation',
        'Formative Assessment: Review first three responses aloud',
        'Resources: Printed worksheet, teacher exemplar, pencils',
      ].join('\n'),
    ],
    independentPractice: [
      [
        'Time: 12 min',
        'Teacher Activity: Set task expectations and start timer',
        'Learner Activity & Success Criteria: Design a labelled diagram for one household appliance',
        'I can: show at least four transformations with arrows',
        'I can: state one efficiency improvement in one sentence',
        'Formative Assessment: Collect diagrams at exit',
        'Resources: A3 paper, coloured pencils, appliance image bank',
      ].join('\n'),
    ],
    formativeAssessment: ['Exit ticket', 'Observations during group work', 'Worksheet review'],
    differentiation: {
      support: ['Provide a word bank and partially completed organizer.'],
      extension: ['Research real-world efficiency improvements.'],
    },
    realWorldConnections: ['Household appliances', 'Transportation systems'],
    plenary: [
      'Time: 5 min',
      'Teacher Activity: Facilitate whip-around and assign exit ticket',
      'Learner Activity & Success Criteria: Share one-sentence summary of key learning',
      'I can: state the most important idea about energy conservation today',
      'Formative Assessment: Exit ticket collected before dismissal',
      'Resources: Exit ticket slips, timer displayed on board',
    ].join('\n'),
  },
};

describe('docx export', () => {
  it('parses structured activity blocks into all five table columns', () => {
    const parsed = parseActivityBlock(sampleLesson.content.mainActivities[0], '5 min');

    expect(parsed.time).toBe('10 min');
    expect(parsed.teacher).toContain('interactive slideshow');
    expect(parsed.learner).toContain('I can:');
    expect(parsed.resources).toContain('Projector');
    expect(parsed.assessment).toContain('Thumbs up/down');
  });

  it('sanitises markdown artifacts from legacy activity strings', () => {
    const legacy =
      '**10 min**\n*Teacher Action:* Present slideshow.\n*Student Action:* Take notes.\n*Resources:* Projector.\n*Checks for Understanding:* Thumbs up/down.';
    const parsed = parseActivityBlock(legacy, '5 min');

    expect(parsed.teacher).not.toContain('*');
    expect(parsed.teacher).toContain('Present slideshow');
    expect(parsed.resources).toContain('Projector');
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
