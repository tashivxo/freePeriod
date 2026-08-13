import type { CurriculumPack } from './types';

export const gcsePack: CurriculumPack = {
  id: 'gcse',
  curriculumValues: ['GCSE'],
  authority: 'GCSE',
  displayName: 'GCSE — Guideline Pack',
  coverage: 'guideline',
  lastReviewed: '2026-08-13',
  sourceNotes: [
    'Maintainer-only public reference: GOV.UK qualifications overview: https://www.gov.uk/education/qualifications. This source is not injected into generated plans.',
    'Maintainer-only public reference: Ofqual: https://www.gov.uk/government/organisations/ofqual. This source is not injected into generated plans.',
    'Maintainer-only public reference: Ofqual GCSE, AS and A level subject content and requirements: https://www.gov.uk/government/collections/gcse-as-and-a-level-subject-content-and-requirements. This source is not injected into generated plans.',
    'This is a practical planning guideline, not official or verified GCSE content, an exam-board specification, or a reproduction of any GCSE subject document.',
  ],
  applicability: [
    'Use for UK GCSE (9–1) planning language.',
    'This pack is not for Cambridge IGCSE.',
    'If the school uses a named exam board, use that board’s pack because it is more specific.',
  ],
  uiHelperText:
    'Guideline pack for UK GCSE planning language. Not official or verified. Not Cambridge IGCSE. If you know your exam board, AQA, Edexcel, or OCR may be more specific.',
  terminology: [
    'Use GCSE and GCSE (9–1) as broad planning language for UK secondary education, while treating the school’s current specification as the source of official requirements.',
    'If the teacher has uploaded a specification, use only identifiers that appear in it; otherwise describe knowledge, application, and analysis in plain language.',
    'Never invent numbered assessment-objective codes, paper or component codes, specification codes, mark schemes, grade boundaries, or official-looking requirements.',
    'Use command words such as describe, explain, compare, analyse, evaluate, and justify as practical teaching language when they suit the intended thinking; this is not an official complete list.',
    'Teach subject vocabulary explicitly and use clear explanations, models, worked examples, sentence stems, glossaries, and structured talk where they improve access without lowering the subject demand.',
    'Keep the planning language distinct from Cambridge IGCSE and from the requirements of any specific AQA, Edexcel, or OCR specification.',
  ],
  assessmentStyle: [
    'Begin with retrieval or a diagnostic check that reveals prerequisite knowledge, misconceptions, and language needs.',
    'Make success criteria observable and specific enough for students to judge whether they can demonstrate the intended knowledge or skill.',
    'Gather evidence through questioning, discussion, modelling, guided practice, practical work, written responses, and independent application, then adapt the lesson in response.',
    'Use short responses, annotated diagrams, worked solutions, explanations, data interpretation, practical records, or extended writing according to the subject.',
    'Use exam-style practice when it serves the learning intention, but do not fabricate mark schemes, paper or component codes, specification codes, grade boundaries, or official scoring rules.',
    'If the teacher has uploaded a specification, use only assessment language and identifiers that appear in it; otherwise assess knowledge, application, and analysis in plain language.',
    'End with an exit check that identifies secure learning, partial understanding, and the next reteach, practice, intervention, or extension step.',
    'Provide feedback that tells students what is accurate, what needs improvement, and what they should do next, including structured self- or peer-review where appropriate.',
  ],
  lessonExpectations: [
    'Write a clear learning intention that identifies the knowledge, concept, skill, or method students should demonstrate by the end of the lesson.',
    'Pair the learning intention with concise success criteria that describe a visible, age-appropriate performance and the expected quality.',
    'Open with purposeful retrieval, a diagnostic question, or a motivating context, then make the relevance of the new learning explicit.',
    'Use modelling and explicit teaching, think aloud about disciplinary choices, and check understanding before moving from guided practice to independent application.',
    'Plan questioning that moves from secure recall towards explanation, application, comparison, interpretation, or evaluation as appropriate for the subject and class.',
    'Make likely misconceptions, vocabulary demands, scaffolds, grouping, resources, timings, and adaptations visible in the plan.',
    'Support learners with clear instructions, visuals, pre-taught vocabulary, sentence frames, structured talk, and models of strong responses without reducing subject demand.',
    'Include meaningful independent or collaborative application and exam-style practice only when it reinforces the learning intention and does not rely on fabricated official details.',
    'Close with reflection or exit evidence that informs the next lesson, homework, intervention, or enrichment rather than simply ending the activity.',
    'Do not add assessment-objective labels, paper or component codes, specification codes, or mark-scheme language unless the teacher’s uploaded specification contains those identifiers.',
  ],
  subjectNotes: {
    Mathematics: [
      'State whether the lesson focuses on fluency, conceptual understanding, reasoning, problem solving, or a connected progression of these.',
      'Model representations and more than one valid strategy where useful, asking students to explain why a method works rather than only reproduce steps.',
      'Use worked examples, deliberate practice, error analysis, and carefully sequenced challenge to expose and address misconceptions.',
      'Pre-teach mathematical vocabulary and use sentence stems so students can explain relationships, methods, and reasoning precisely.',
    ],
    English: [
      'Make the learning intention measurable through a specific reading, writing, speaking, listening, vocabulary, grammar, or integrated language performance.',
      'Use an appropriate text or model, demonstrate the target skill, guide students through evidence and structure, and then provide time for independent production.',
      'Teach vocabulary and literary or language terminology in context, using glossaries, sentence frames, and structured discussion where they improve access.',
      'Use success criteria for meaning, evidence, organisation, accuracy, and audience, and give students a supported opportunity to revise their work.',
    ],
    Science: [
      'Anchor the lesson in explaining a concept, applying scientific knowledge, planning an investigation, interpreting evidence, or evaluating a claim.',
      'Make practical work explicit about the question, prediction, variables, safety expectations, roles, recording method, and evidence-based conclusion.',
      'Use models, diagrams, prediction questions, hinge questions, and data interpretation to reveal misconceptions before independent application.',
      'Pre-teach scientific vocabulary and response structures so students can communicate precise explanations without lowering the scientific demand.',
    ],
    'Computer Science': [
      'Make the computational learning intention visible through decomposition, abstraction, algorithms, programming, data representation, systems, or digital problem solving as appropriate.',
      'Model the reasoning and debugging process, then move from a small guided example to independent or paired construction, testing, and explanation.',
      'Use trace tables, annotated pseudocode, diagrams, test cases, and precise technical vocabulary to make computational thinking observable.',
      'Support students with visual representations, carefully sequenced instructions, and language frames for describing logic, errors, and design decisions.',
    ],
    History: [
      'Frame the lesson around chronological understanding, causation, consequence, change and continuity, significance, interpretation, or the use of evidence.',
      'Model how to select and explain relevant evidence, distinguish a source from an interpretation, and build a supported historical explanation.',
      'Use timelines, source comparison, structured debate, and paragraph frames before asking students to produce an independent response.',
      'Pre-teach historical vocabulary and provide language support while preserving opportunities for students to weigh evidence and communicate a reasoned judgement.',
    ],
    Geography: [
      'Connect the learning intention to geographical knowledge, place, processes, patterns, data, fieldwork, human-environment relationships, or decision making.',
      'Model how to read maps, diagrams, photographs, graphs, and data, then require students to explain patterns with accurate geographical vocabulary.',
      'Use local, regional, and global examples where they clarify the concept, without adding irrelevant case-study detail or implying an official specification sequence.',
      'Support students with labelled visuals, vocabulary banks, sentence stems, and structured interpretation before independent analysis.',
    ],
  },
};

export const GCSE_PACK = gcsePack;
