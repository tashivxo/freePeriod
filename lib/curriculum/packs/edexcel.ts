import type { CurriculumPack } from './types';

export const edexcelPack: CurriculumPack = {
  id: 'edexcel',
  curriculumValues: ['Edexcel'],
  authority: 'EDEXCEL',
  displayName: 'Edexcel — Guideline Pack',
  coverage: 'guideline',
  lastReviewed: '2026-08-13',
  sourceNotes: [
    'Maintainer source: Pearson Qualifications public overview pages at https://qualifications.pearson.com/en/qualifications.html and https://qualifications.pearson.com/en/support/support-for-you/teachers.html.',
    'These public overview pages provide orientation only; this pack is not official, verified, or a reproduction of Pearson Edexcel specification content.',
    'Use the current Pearson Edexcel specification supplied by the school for official subject content, assessment requirements, identifiers, and terminology.',
    'Source notes are maintainer-only and must not be injected into generated lesson content.',
  ],
  applicability: [
    'Use for Pearson Edexcel GCSE and A-Level / AS planning language.',
    'This is not a guide for AQA, OCR, or Cambridge International.',
    'Use the current Edexcel specification the school actually teaches.',
  ],
  uiHelperText:
    'Guideline pack for Pearson Edexcel GCSE and A-Level planning language. Not official or verified. Not AQA, OCR, or Cambridge.',
  terminology: [
    'Name Pearson Edexcel as the board when describing the planning context; use the current Edexcel specification supplied by the school for official subject detail.',
    'Use learning intention, success criteria, modelling, guided practice, independent application, retrieval, misconception, feedback, and reflection as practical planning language.',
    'Use plain-language prompts such as describe, explain, apply, analyse, and evaluate to shape classroom tasks when they suit the intended thinking.',
    'If an uploaded specification exists, use only identifiers that appear in it. Do not invent specification codes, paper or component codes, Assessment Objective numbers, or mark schemes.',
    'Without an uploaded specification, describe knowledge, application, analysis, and evaluation in plain language rather than implying an official code or assessment structure.',
    'Use subject vocabulary precisely and pre-teach essential terms, especially where English is an additional language for some learners.',
    'Keep the cognitive demand of the subject high while providing language access through visuals, worked examples, sentence stems, glossaries, structured talk, and opportunities to rehearse ideas.',
  ],
  assessmentStyle: [
    'Begin with a short retrieval or diagnostic check that reveals prerequisite knowledge, misconceptions, and language needs.',
    'Make success criteria observable and specific enough for students to judge whether they can demonstrate the intended knowledge or skill.',
    'Gather evidence during modelling, guided practice, questioning, discussion, practical work, and independent application, then adjust the lesson in response.',
    'Use short responses, annotated diagrams, worked solutions, explanations, data interpretation, practical records, or extended writing according to the subject.',
    'Use exam-style practice when it serves the learning intention, but do not invent specification codes, paper or component codes, Assessment Objective numbers, mark schemes, grade boundaries, or official scoring rules.',
    'If the teacher uploads the current specification, use only assessment language and identifiers that appear in it; otherwise assess knowledge, application, analysis, and evaluation in plain language.',
    'Provide feedback that tells students what is accurate, what needs improvement, and what they should do next; include structured self- or peer-review where appropriate.',
    'End with an exit check that identifies secure learning, partial understanding, and the next reteach, practice, intervention, or extension step.',
  ],
  lessonExpectations: [
    'Write a clear learning intention that identifies the knowledge, concept, skill, or method students should demonstrate by the end of the lesson.',
    'Pair the learning intention with concise success criteria that describe a visible, age-appropriate performance and the expected quality.',
    'Open with purposeful retrieval, a diagnostic question, or a motivating context, then make the relevance of the new learning explicit.',
    'Use explicit teaching and modelling, think aloud about disciplinary choices, and check understanding before moving from guided practice to independent application.',
    'Plan questioning that moves from secure recall towards explanation, application, analysis, comparison, interpretation, or evaluation as appropriate for the subject and class.',
    'Make likely misconceptions, vocabulary demands, scaffolds, grouping, resources, timings, and adaptations visible in the plan.',
    'Support EAL and ESL learners with pre-taught vocabulary, clear instructions, visuals, sentence frames, structured partner talk, and models of strong responses without reducing subject demand.',
    'Include independent application and exam-style practice without fabricated mark schemes or assessment identifiers; use real-world application when it reinforces the learning intention.',
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
      'Use local, regional, and global examples where they clarify the concept, without adding irrelevant case-study detail or implying an official specification sequence.',
      'Support EAL and ESL learners with labelled visuals, vocabulary banks, sentence stems, and structured interpretation before independent analysis.',
    ],
  },
};

export const EDEXCEL_PACK = edexcelPack;
