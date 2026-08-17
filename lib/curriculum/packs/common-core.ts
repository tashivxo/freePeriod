import type { CurriculumPack } from './types';

export const commonCorePack: CurriculumPack = {
  id: 'common-core',
  curriculumValues: ['Common Core'],
  authority: 'COMMON_CORE',
  displayName: 'Common Core — Guideline Pack',
  coverage: 'guideline',
  lastReviewed: '2026-08-17',
  sourceNotes: [
    'Maintainer-only reference: Common Core State Standards Initiative overview: https://www.thecorestandards.org/about-the-standards/. This source is not injected into generated plans.',
    'Maintainer-only reference: Common Core English Language Arts Standards overview: https://www.thecorestandards.org/ELA-Literacy/. This source is not injected into generated plans.',
    'Maintainer-only reference: Common Core Mathematics Standards overview: https://www.thecorestandards.org/Math/. This source is not injected into generated plans.',
  ],
  applicability: [
    'This pack applies to United States English Language Arts (ELA) and Mathematics planning only.',
    'There is no single United States national curriculum; Common Core is a set of state standards adopted in varying ways.',
    'Science, social studies, and other subjects must not use CCSS or NGSS identifiers from this pack; write their objectives in plain language.',
  ],
  uiHelperText:
    'Guideline pack for Common Core ELA and Math planning language. Not official or verified. Common Core is not a national US curriculum and is not NGSS or AP.',
  terminology: [
    'Use Common Core planning language for English Language Arts (ELA) and Mathematics, while treating the current state- or school-adopted standards document as the source of local requirements.',
    'For subjects other than ELA and Math, write plain-language objectives; do not emit CCSS or NGSS identifiers.',
    'Do not invent standards identifiers or reproduce a code-like label from memory; use a teacher-provided identifier only when it appears in uploaded or school-provided curriculum material.',
    'For ELA, strengthen reading, writing, speaking, listening, and language through comprehension, evidence, vocabulary, organization, conventions, revision, and purposeful communication.',
    'For Mathematics, strengthen conceptual understanding, procedural fluency, application, reasoning, problem solving, and connections among concrete, visual, symbolic, and verbal representations.',
  ],
  assessmentStyle: [
    'Use diagnostic questions, retrieval, observation, discussion, and short tasks to identify what students understand before new instruction.',
    'Collect evidence of reasoning, evidence use, communication, and application during the lesson, not only evidence of completed answers.',
    'State success criteria in clear, observable language and connect them directly to the lesson objective.',
    'Use written work, oral explanation, representations, revision, and error analysis to assess understanding where they fit the subject and task.',
    'Use exit evidence to identify secure learning, misconceptions, and the next instructional step.',
    'Keep assessment language proportionate and actionable rather than treating one score as the whole picture of progress.',
  ],
  lessonExpectations: [
    'Write measurable objectives that state what students will know, understand, explain, create, or apply by the end of the lesson.',
    'For ELA and Mathematics, use standards-aligned planning language only when it is supported by the relevant uploaded or school-provided document.',
    'For subjects other than ELA and Math, write plain-language objectives and do not emit CCSS or NGSS identifiers.',
    'Do not invent standards identifiers; preserve one only when it appears verbatim in an uploaded document.',
    'Model the target thinking or process, provide guided practice, and make the transition to independent or collaborative application explicit.',
    'Plan questions and checks for understanding that reveal reasoning, evidence use, misconceptions, and readiness for the next step.',
    'Include accessible materials, vocabulary support, scaffolds, flexible grouping, and appropriate challenge without lowering the cognitive demand of the objective.',
    'End with a concise check that informs reteaching, practice, extension, or the next lesson.',
  ],
  subjectNotes: {
    English: [
      'Frame ELA objectives around reading, writing, speaking, listening, and language use in a specific text, task, or communication context.',
      'Ask students to comprehend, select, explain, and use evidence while attending to meaning, vocabulary, organization, audience, and purpose.',
      'Model planning, drafting, discussion, revision, and editing when those processes are part of the learning goal.',
      'Assess comprehension, evidence, organization, conventions, vocabulary, and communication with clear criteria that students can use for self- or peer review.',
    ],
    Mathematics: [
      'State whether the lesson emphasizes conceptual understanding, procedural fluency, application, reasoning, or a deliberate combination.',
      'Model multiple representations, such as concrete materials, diagrams, symbols, tables, graphs, or verbal explanations, and connect their meanings.',
      'Ask students to explain why a strategy works, compare approaches, justify conclusions, and use precise mathematical language.',
      'Use worked examples, purposeful practice, error analysis, and application tasks to surface misconceptions, strengthen procedural fluency, and support transfer.',
    ],
  },
};

export const COMMON_CORE_PACK = commonCorePack;
