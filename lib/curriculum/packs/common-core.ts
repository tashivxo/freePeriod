import type { CurriculumPack } from './types';

export const commonCorePack: CurriculumPack = {
  id: 'common-core',
  curriculumValues: ['Common Core'],
  authority: 'COMMON_CORE',
  displayName: 'Common Core — Guideline Pack',
  coverage: 'guideline',
  lastReviewed: '2026-08-13',
  sourceNotes: [
    'Maintainer-only reference: Common Core State Standards Initiative overview: https://www.thecorestandards.org/about-the-standards/. This source is not injected into generated plans.',
    'Maintainer-only reference: Common Core English Language Arts Standards overview: https://www.thecorestandards.org/ELA-Literacy/. This source is not injected into generated plans.',
    'Maintainer-only reference: Common Core Mathematics Standards overview: https://www.thecorestandards.org/Math/. This source is not injected into generated plans.',
  ],
  applicability: [
    'This pack applies to United States English Language Arts and Mathematics planning only.',
    'There is no single United States national curriculum; Common Core is a set of state standards adopted in varying ways.',
    'Science, social studies, and other subjects must not use CCSS or NGSS identifiers from this pack.',
  ],
  uiHelperText:
    'Guideline pack for Common Core ELA and Math planning language. Not official or verified. Common Core is not a national US curriculum and is not NGSS or AP.',
  terminology: [
    'Use Common Core as planning language for English Language Arts and Mathematics, while treating the current state- or school-adopted standards document as the source of official requirements.',
    'For subjects other than ELA and Math, write plain-language objectives; do not emit CCSS or NGSS identifiers.',
    'Do not invent dotted CCSS codes unless they appear verbatim in an uploaded document.',
    'For ELA, describe reading, writing, speaking and listening, and language learning through evidence, organization, conventions, and purposeful communication.',
    'For Mathematics, describe conceptual understanding, procedural fluency, application, reasoning, and connections among multiple representations without relying on domain codes.',
  ],
  assessmentStyle: [
    'Use diagnostic questions, retrieval, observation, discussion, and short tasks to identify what students understand before new instruction.',
    'Collect evidence of reasoning and application during the lesson, not only evidence of completed answers.',
    'State success criteria in clear, observable language and connect them directly to the lesson objective.',
    'Use written work, oral explanation, representations, and revision to assess understanding where they fit the subject and task.',
    'Use exit evidence to identify secure learning, misconceptions, and the next instructional step.',
    'Keep assessment language proportionate and actionable rather than treating one score as the whole picture of progress.',
  ],
  lessonExpectations: [
    'Write measurable objectives that state what students will know, understand, explain, create, or apply by the end of the lesson.',
    'For ELA and Mathematics, use standards-aligned planning language only when it is supported by the relevant uploaded or school-provided document.',
    'For subjects other than ELA and Math, write plain-language objectives and do not emit CCSS or NGSS identifiers.',
    'Do not invent dotted CCSS codes; preserve an identifier only when it appears verbatim in an uploaded document.',
    'Model the target thinking or process, provide guided practice, and make the transition to independent or collaborative application explicit.',
    'Plan questions and checks for understanding that reveal reasoning, evidence use, misconceptions, and readiness for the next step.',
    'Include accessible materials, vocabulary support, scaffolds, flexible grouping, and appropriate challenge without lowering the cognitive demand of the objective.',
    'End with a concise check that informs reteaching, practice, extension, or the next lesson.',
  ],
  subjectNotes: {
    English: [
      'Frame objectives around reading, writing, speaking and listening, and language use in a specific text, task, or communication context.',
      'Ask students to select, explain, and use evidence while attending to meaning, organization, audience, and purpose.',
      'Model planning, drafting, discussion, revision, and editing when those processes are part of the learning goal.',
      'Assess comprehension, evidence, organization, conventions, and communication with clear criteria that students can use for self- or peer review.',
    ],
    Mathematics: [
      'State whether the lesson emphasizes conceptual understanding, procedural fluency, application, reasoning, or a deliberate combination.',
      'Model multiple representations, such as concrete materials, diagrams, symbols, tables, graphs, or verbal explanations, and connect their meanings.',
      'Ask students to explain why a strategy works, compare approaches, justify conclusions, and use precise mathematical language.',
      'Use worked examples, purposeful practice, error analysis, and application tasks to surface misconceptions and strengthen transfer.',
    ],
  },
};

export const COMMON_CORE_PACK = commonCorePack;
