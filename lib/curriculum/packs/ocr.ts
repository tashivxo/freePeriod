import type { CurriculumPack } from './types';

export const ocrPack: CurriculumPack = {
  id: 'ocr',
  curriculumValues: ['OCR'],
  authority: 'OCR',
  displayName: 'OCR — Guideline Pack',
  coverage: 'guideline',
  lastReviewed: '2026-08-13',
  sourceNotes: [
    'Maintainer-only public overview: OCR qualifications: https://www.ocr.org.uk/qualifications/.',
    'Maintainer-only public overview: OCR GCSE qualifications: https://www.ocr.org.uk/qualifications/gcse/.',
    'Maintainer-only public overview: OCR AS and A Level qualifications: https://www.ocr.org.uk/qualifications/as-and-a-level/.',
    'These source notes are for maintainers only and are not injected into generated lesson content.',
    'Use the current OCR specification supplied by the school or teacher for official subject content, identifiers, assessment requirements, and required terminology.',
  ],
  applicability: [
    'Use for OCR GCSE and OCR A-Level / AS planning language.',
    'This applies to OCR and is not an AQA, Edexcel, or Cambridge International guide.',
    'Use the current OCR specification that the school actually teaches.',
    'Do not use this pack for AQA, Edexcel, Cambridge International, or another school’s locally authored programme.',
  ],
  uiHelperText:
    'Guideline pack for OCR GCSE and A-Level planning language. Not official or verified. Not AQA, Edexcel, or Cambridge.',
  terminology: [
    'Guideline only. NEVER invent specification codes, unit or paper codes, Assessment Objective numbers, or mark schemes.',
    'If an uploaded specification exists, use only identifiers that appear in it; otherwise use plain-language knowledge, application, analysis, and evaluation.',
    'Use learning intention, success criteria, modelling, guided practice, independent application, retrieval, misconception, feedback, and reflection as practical planning language.',
    'Use command words such as state, describe, explain, compare, analyse, and evaluate to shape classroom tasks when they suit the intended thinking; this is a practical selection, not a claim to be a complete official list.',
    'Use subject vocabulary precisely and pre-teach essential terms, especially where English is an additional language for some learners.',
    'Keep the cognitive demand of the subject high while providing language access through visuals, worked examples, sentence stems, glossaries, structured talk, and opportunities to rehearse ideas.',
    'Describe exam-style practice as preparation for communicating subject understanding, not as a substitute for teaching the underlying knowledge and skills.',
  ],
  assessmentStyle: [
    'Begin with a short retrieval or diagnostic check that reveals prerequisite knowledge, misconceptions, and language needs.',
    'Make success criteria observable and specific enough for students to judge whether they can demonstrate the intended knowledge or skill.',
    'Gather evidence during modelling, guided practice, questioning, discussion, practical work, and independent application, then adjust the lesson in response.',
    'Use short responses, annotated diagrams, worked solutions, explanations, data interpretation, practical records, or extended writing according to the subject.',
    'Use exam-style practice when it serves the learning intention, but do not invent specification identifiers, mark schemes, grade boundaries, paper structures, or official scoring rules.',
    'If an uploaded specification exists, use only assessment language and identifiers that appear in it; otherwise assess knowledge, application, analysis, and evaluation in plain language without inventing numbered Assessment Objectives.',
    'End with an exit check that identifies secure learning, partial understanding, and the next reteach, practice, intervention, or extension step.',
    'Provide feedback that tells students what is accurate, what needs improvement, and what they should do next; include structured self- or peer-review where appropriate.',
  ],
  lessonExpectations: [
    'Write a clear learning intention that identifies the knowledge, concept, skill, or method students should demonstrate by the end of the lesson.',
    'Pair the learning intention with concise success criteria that describe a visible, age-appropriate performance and the expected quality.',
    'Open with purposeful retrieval, a diagnostic question, or a motivating context, then make the relevance of the new learning explicit.',
    'Use explicit teaching and modelling, think aloud about disciplinary choices, and check understanding before moving from guided practice to independent application.',
    'Plan questioning that moves from secure recall towards explanation, application, comparison, interpretation, analysis, or evaluation as appropriate for the subject and class.',
    'Make likely misconceptions, vocabulary demands, scaffolds, grouping, resources, timings, and adaptations visible in the plan.',
    'Support EAL and ESL learners with pre-taught vocabulary, clear instructions, visuals, sentence frames, structured partner talk, and models of strong responses without reducing subject demand.',
    'Include the lesson shape of learning intention, success criteria, modelling, guided practice, independent application, and exam-style practice where it reinforces the learning intention.',
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

export const OCR_PACK = ocrPack;
