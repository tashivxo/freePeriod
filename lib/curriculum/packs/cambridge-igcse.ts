import type { CurriculumPack } from './types';

export const cambridgeIgcsePack: CurriculumPack = {
  id: 'cambridge-igcse',
  curriculumValues: ['Cambridge IGCSE'],
  authority: 'CAMBRIDGE',
  displayName: 'Cambridge International IGCSE — Guideline Pack',
  coverage: 'guideline',
  lastReviewed: '2026-08-17',
  sourceNotes: [
    'This is a practical planning guideline, not an official Cambridge International document, a verified syllabus, or a reproduction of any Cambridge IGCSE syllabus.',
    'Cambridge International’s public Cambridge IGCSE programme overview describes the programme and its broad subject offering: https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse/.',
    'Use the current Cambridge IGCSE syllabus supplied by the school or teacher for official subject content, Assessment Objectives, assessment requirements, and any required terminology.',
    'This pack deliberately avoids reproducing syllabuses, syllabus codes, paper or component codes, mark schemes, or a complete list of official command words.',
  ],
  applicability: [
    'Use for international schools planning with the Cambridge International IGCSE programme, typically for learners aged 14–16.',
    'This applies to Cambridge IGCSE and is not a UK GCSE exam-board guide.',
    'Do not use this pack for UK GCSE, AQA, Edexcel, OCR, or another school’s locally authored programme.',
  ],
  uiHelperText:
    'Guideline pack for Cambridge International IGCSE planning language. Not official or verified. Not GCSE, AQA, Edexcel, or OCR.',
  terminology: [
    'Name the current Cambridge International IGCSE subject and use the school-supplied syllabus as teacher context when setting the learning intention; do not invent course details.',
    'Use learning intention, success criteria, modelling, guided practice, independent application, retrieval, misconception, feedback, and reflection as practical planning language.',
    'Use command words such as state, explain, and evaluate to shape classroom tasks when they suit the intended thinking; this is a practical selection, not a claim to be a complete official list.',
    'If the teacher has uploaded the current syllabus, align terminology to its stated content; otherwise describe knowledge, application, and analysis in plain language.',
    'Use subject vocabulary precisely and pre-teach essential terms, especially where English is an additional language for some learners.',
    'Keep the cognitive demand of the subject high while providing language access through visuals, worked examples, sentence stems, glossaries, structured talk, and opportunities to rehearse ideas.',
    'Describe command-word practice as preparation for communicating subject understanding, not as a substitute for teaching the underlying knowledge and skills.',
  ],
  assessmentStyle: [
    'Begin with a short retrieval or diagnostic check that reveals prerequisite knowledge, misconceptions, and language needs.',
    'Make success criteria observable and specific enough for students to judge whether they can demonstrate the intended knowledge or skill.',
    'Gather evidence during modelling, guided practice, questioning, discussion, practical work, and independent application, then adjust the lesson in response.',
    'Use short responses, annotated diagrams, worked solutions, explanations, data interpretation, practical records, or extended writing according to the subject.',
    'Use exam-style practice when it serves the learning intention, but do not invent mark schemes, grade boundaries, or official scoring rules.',
    'If the teacher uploads the current syllabus, align assessment language to its stated content; otherwise assess knowledge, application, and analysis in plain language.',
    'Use exam-style practice to rehearse communicating knowledge, application, and analysis in unfamiliar contexts, without inventing or reproducing mark schemes.',
    'End with an exit check that identifies secure learning, partial understanding, and the next reteach, practice, intervention, or extension step.',
    'Provide feedback that tells students what is accurate, what needs improvement, and what they should do next; include structured self- or peer-review where appropriate.',
  ],
  lessonExpectations: [
    'Write a clear learning intention that identifies the knowledge, concept, skill, or method students should demonstrate by the end of the lesson.',
    'Pair the learning intention with concise success criteria that describe a visible, age-appropriate performance and the expected quality.',
    'Open with purposeful retrieval, a diagnostic question, or a motivating context, then make the relevance of the new learning explicit.',
    'Use explicit teaching and modelling, think aloud about disciplinary choices, and check understanding before moving from guided practice to independent application.',
    'Plan questioning that moves from secure recall towards explanation, application, comparison, interpretation, or evaluation as appropriate for the subject and class.',
    'Make likely misconceptions, vocabulary demands, scaffolds, grouping, resources, timings, and adaptations visible in the plan.',
    'Support EAL and ESL learners with pre-taught vocabulary, clear instructions, visuals, sentence frames, structured partner talk, and models of strong responses without reducing subject demand.',
    'Include a meaningful independent or collaborative product and exam-style practice without mark schemes only when it reinforces the learning intention.',
    'Close with reflection or exit evidence that informs the next lesson, homework, intervention, or enrichment rather than simply ending the activity.',
  ],
  subjectNotes: {
    Mathematics: [
      'State whether the lesson focuses on fluency, conceptual understanding, reasoning, problem solving, or a connected progression of these.',
      'Model representations and more than one valid strategy where useful, asking students to explain why a method works rather than only reproduce steps.',
      'Use worked examples, deliberate practice, error analysis, and carefully sequenced challenge to expose and address misconceptions.',
      'Pre-teach mathematical vocabulary and use sentence stems so EAL and ESL learners can explain relationships, methods, and reasoning precisely.',
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
      'Pre-teach scientific vocabulary and response structures so EAL and ESL learners can communicate precise explanations without lowering the scientific demand.',
    ],
    'Computer Science': [
      'Make the computational learning intention visible through decomposition, abstraction, algorithms, programming, data representation, systems, or digital problem solving as appropriate.',
      'Model the reasoning and debugging process, then move from a small guided example to independent or paired construction, testing, and explanation.',
      'Use trace tables, annotated pseudocode, diagrams, test cases, and precise technical vocabulary to make computational thinking observable.',
      'Support EAL and ESL learners with visual representations, carefully sequenced instructions, and language frames for describing logic, errors, and design decisions.',
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
      'Use local, regional, and global examples where they clarify the concept, without adding irrelevant case-study detail or implying an official syllabus sequence.',
      'Support EAL and ESL learners with labelled visuals, vocabulary banks, sentence stems, and structured interpretation before independent analysis.',
    ],
  },
};

export const CAMBRIDGE_IGCSE_PACK = cambridgeIgcsePack;
