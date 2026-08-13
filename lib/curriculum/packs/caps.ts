import type { CurriculumPack } from './types';

export const capsPack: CurriculumPack = {
  id: 'caps',
  curriculumValues: ['CAPS (South Africa)'],
  authority: 'CAPS',
  displayName: 'CAPS (South Africa) — Guideline Pack',
  coverage: 'guideline',
  lastReviewed: '2026-08-13',
  sourceNotes: [
    'Maintainer-only reference: Department of Basic Education CAPS overview: https://www.education.gov.za/Curriculum/CurriculumAssessmentPolicyStatements(CAPS).aspx. This note is not injected into lesson-generation prompts.',
    'Maintainer-only reference: Department of Basic Education curriculum documents: https://www.education.gov.za/Curriculum.aspx. Verify the current CAPS or Annual Teaching Plan before using official topics, codes, or recommended time allocations. This note is not injected into prompts.',
    'This is a practical guideline pack, not official or verified CAPS content. Do not reproduce or dump CAPS PDF text verbatim.',
  ],
  applicability: [
    'South African public and independent schools using CAPS/NCS.',
    'Use the school’s current CAPS documents, subject policy, and Annual Teaching Plan for official requirements, sequencing, topics, codes, and time allocations.',
  ],
  uiHelperText:
    'Guideline pack for CAPS planning language. Not official or verified. Upload a CAPS extract or Annual Teaching Plan if you need official topics or codes.',
  terminology: [
    'Use CAPS and NCS when referring to the Curriculum and Assessment Policy Statement and the National Curriculum Statement framework.',
    'Describe learning through specific aims, subject knowledge, skills, and learner performance rather than inventing outcome or standard codes.',
    'Use plain-language topic names and mention recommended time allocation only when it is supplied by the teacher or the uploaded CAPS or Annual Teaching Plan.',
    'Distinguish informal assessment during learning from formal assessment that is recorded or contributes to the school’s assessment programme.',
    'Use inclusive education language that identifies barriers to participation and plans reasonable, curriculum-aligned support without lowering expectations.',
    'Use English and Afrikaans bilingually only when the school language policy requires it; do not assume that Afrikaans is the school’s language of learning or teaching.',
    'Never invent CAPS topic codes, Annual Teaching Plan codes, or “Term X Topic Y” identifiers. Use plain-language topics unless the teacher has uploaded the relevant CAPS or Annual Teaching Plan text.',
  ],
  assessmentStyle: [
    'Begin with a brief recap, retrieval task, or diagnostic question to identify prior knowledge and misconceptions.',
    'Use informal assessment through questioning, observation, discussion, learner work, practical performance, or a short written response during the lesson.',
    'Make the expected learner performance and success criteria clear, using accessible language and examples where useful.',
    'Use evidence from the activity to adapt explanations, grouping, scaffolds, pace, or challenge before the lesson ends.',
    'Keep formal assessment separate from informal checks and follow the school’s current assessment programme, recording requirements, and moderation process.',
    'End with a short consolidation or exit check that identifies secure learning, remaining misconceptions, and the next teaching response.',
    'Plan support and extension from assessment evidence while maintaining meaningful participation and high expectations for every learner.',
  ],
  lessonExpectations: [
    'State a measurable objective connected to the relevant CAPS or NCS learning intention, using a plain-language topic unless the teacher supplied an official document.',
    'Shape the lesson as recap, teacher input or modelling, learner activity, consolidation, and informal assessment.',
    'Make teacher actions, learner actions, resources, timings, transitions, and checks for understanding visible enough for practical classroom use.',
    'Use purposeful questioning to expose misconceptions, develop subject vocabulary, and give all learners structured opportunities to respond.',
    'Move from explicit teaching or modelling to guided practice and then independent or collaborative application appropriate to the subject and grade.',
    'Plan inclusive access through clear instructions, visuals, vocabulary support, chunked tasks, flexible grouping, accessible resources, and appropriate challenge.',
    'Use bilingual English and Afrikaans support only where required by the school language policy, and do not make translation the sole learning activity.',
    'Do not add official-looking CAPS, Annual Teaching Plan, term, or topic codes unless they appear in text uploaded by the teacher.',
  ],
  subjectNotes: {
    Mathematics: [
      'Identify whether the lesson emphasises fluency, conceptual understanding, reasoning, problem solving, or a deliberate combination.',
      'Use representations, worked examples, mathematical language, and more than one strategy where these make learner thinking visible.',
      'Include opportunities for learners to explain methods, compare solutions, analyse errors, and connect procedures to meaning.',
      'Use informal assessment to identify misconceptions before independent practice, then adjust scaffolding or challenge accordingly.',
    ],
    English: [
      'Set a measurable language objective for reading, writing, speaking, listening, vocabulary, grammar, literature, or an integrated performance.',
      'Use an appropriate text or model, teach the target skill explicitly, and move from guided practice to independent communication.',
      'Teach vocabulary in context and use sentence frames, glossaries, or language support when they improve access without reducing cognitive demand.',
      'Assess meaning, evidence, organisation, accuracy, and audience awareness with criteria learners can use for self- or peer review.',
    ],
    Science: [
      'Frame the lesson around explaining, predicting, investigating, interpreting evidence, analysing data, or communicating scientific reasoning.',
      'For biology or Life Sciences-style learning, connect concepts to systems, processes, evidence, and appropriate scientific terminology without inventing CAPS codes.',
      'Make practical work clear through a question, prediction, variables, safety expectations, roles, recording method, and evidence-based conclusion.',
      'Use prediction questions, annotated diagrams, hinge questions, data interpretation, and misconception checks to guide reteaching or extension.',
    ],
    History: [
      'Use chronology, cause and consequence, change and continuity, significance, perspectives, and evidence as appropriate to the topic.',
      'Ask learners to interpret sources, timelines, artefacts, images, or accounts and distinguish evidence from unsupported opinion.',
      'Make the historical enquiry question and the evidence needed for a reasoned response explicit.',
      'Assess explanation, source use, contextual understanding, comparison, and communication through an age-appropriate product.',
    ],
    Geography: [
      'Use place, spatial pattern, physical and human processes, scale, interdependence, and sustainability where they genuinely support the objective.',
      'Plan map, fieldwork, diagram, data, photograph, or case-study work with clear observation and recording expectations.',
      'Teach geographical vocabulary explicitly and connect local South African contexts to wider regional or global patterns when relevant.',
      'Assess interpretation, application of evidence, explanation of processes, and reasoned conclusions rather than recall alone.',
    ],
    'Physical Education': [
      'State the movement, physical literacy, tactical, health, or personal-development outcome learners will demonstrate.',
      'Include safety, equipment, space, warm-up, participation roles, adaptations, and clear success criteria for practical activity.',
      'Use observation and learner reflection as informal assessment of technique, decision making, effort, cooperation, and safe participation.',
      'Offer inclusive adaptations that preserve the intended learning and meaningful participation for learners with different needs or levels of confidence.',
    ],
  },
};

export const CAPS_PACK = capsPack;
