import type { CurriculumPack } from './types';

export const cbsePack: CurriculumPack = {
  id: 'cbse',
  curriculumValues: ['CBSE (India)'],
  authority: 'CBSE',
  displayName: 'CBSE (India) — Guideline Pack',
  coverage: 'guideline',
  lastReviewed: '2026-08-17',
  sourceNotes: [
    'Maintainer-only reference: Central Board of Secondary Education overview: https://www.cbse.gov.in/. This note is not injected into lesson-generation prompts.',
    'Maintainer-only reference: CBSE Academic portal and curriculum resources: https://cbseacademic.nic.in/. Check the current CBSE subject document and school guidance before using official requirements. This note is not injected into prompts.',
    'This is a practical guideline pack, not official or verified CBSE or NCERT content. Do not reproduce or dump textbook or curriculum document text verbatim.',
  ],
  applicability: [
    'Use this pack for CBSE-affiliated schools in India and overseas that follow current CBSE guidance and subject documents.',
    'Do not apply this pack to Indian state boards, ICSE, Cambridge, or another curriculum simply because the school is located in India.',
    'NCERT textbooks are commonly used classroom resources, but they do not replace the current CBSE subject document or the school’s approved curriculum guidance.',
    'Treat NEP 2020 as national policy context that CBSE is aligning towards, not as a second curriculum or a source of separate lesson requirements.',
  ],
  uiHelperText:
    'Guideline pack for CBSE planning language. Not official or verified. Upload a current CBSE or NCERT extract if you need official topics or codes.',
  terminology: [
    'Use CBSE and CBSE-affiliated school when describing the board context, and use the school’s current subject document for official requirements.',
    'Express competencies and learning outcomes in plain language by stating what learners will know, understand, do, explain, create, or apply by the end of the lesson.',
    'Use competency-based education language when learners apply knowledge, reason, communicate, solve problems, create, or demonstrate understanding in a meaningful context.',
    'Treat NCERT textbooks as commonly used resources that can support teaching, while the current CBSE subject document and school policy determine official scope and sequence.',
    'Mention NEP 2020 as policy context when it helps explain a learner-centred, competency-based, inclusive, or experiential approach; do not present it as a separate curriculum.',
    'Use formative assessment for feedback during learning and summative assessment for an end point or recorded judgement, following the school’s current assessment practice.',
    'Refer to Class 10 and Class 12 board examinations as context for preparation and application when relevant, without assuming a particular examination structure or marking requirement.',
    'Use English and Hindi bilingually only when the school’s language policy or the teacher’s stated context requires it; do not assume Hindi is needed.',
    'Use plain-language topics and outcomes unless the teacher supplies the relevant current CBSE or school document.',
  ],
  assessmentStyle: [
    'Begin with a short recap, retrieval prompt, diagnostic question, or familiar context to surface prior knowledge and likely misconceptions.',
    'Use formative checks through questioning, observation, discussion, learner explanations, worked examples, practical activity, or a brief written response during the lesson.',
    'Make the intended competency and expected learner performance visible in plain language, with success criteria that learners can understand and use.',
    'Gather evidence of reasoning, application, communication, creativity, collaboration, or problem solving when those capabilities are part of the lesson objective.',
    'Use learner responses and work to adjust explanation, modelling, grouping, scaffolding, pace, or challenge before the lesson ends.',
    'Keep summative assessment distinct from formative checks and follow the school’s current CBSE-aligned assessment plan, recording requirements, and moderation process.',
    'Use an exit question, short reflection, or consolidation task to identify secure learning, remaining misconceptions, and the next teaching response.',
    'Connect board-examination preparation to understanding, application, and clear communication when relevant, without assuming a specific paper structure or marking scheme.',
  ],
  lessonExpectations: [
    'State a measurable objective connected to current CBSE subject guidance or a teacher-supplied extract, using a plain-language topic and competency.',
    'Shape a typical period as recap, teacher explanation or modelling, learner activity, checking understanding, and homework or extension when appropriate.',
    'Make teacher actions, learner actions, resources, approximate timings, transitions, and checks for understanding clear enough for practical classroom use.',
    'Move from explicit teaching or modelling to guided practice and then independent or collaborative application suited to the subject, age, and objective.',
    'Use purposeful questions and accessible examples to develop subject vocabulary, expose misconceptions, and give all learners structured opportunities to respond.',
    'Use experiential learning, art-integrated learning, or 21st-century skills language when it authentically supports the lesson objective rather than as decoration.',
    'Plan inclusive access through clear instructions, visuals, vocabulary support, chunked tasks, flexible grouping, accessible resources, and appropriate challenge.',
    'Use English and Hindi support only where the school language policy or teacher context requires it, and do not make translation the sole learning activity.',
    'Keep official scope, sequencing, and assessment decisions grounded in the current document supplied by the school or teacher.',
  ],
  subjectNotes: {
    Mathematics: [
      'Identify whether the lesson emphasises fluency, conceptual understanding, reasoning, problem solving, or a deliberate combination.',
      'Use representations, worked examples, mathematical language, and more than one strategy when these make learner thinking visible.',
      'Give learners opportunities to explain methods, compare solutions, analyse errors, and connect procedures to meaning or a familiar context.',
      'Use formative assessment to identify misconceptions before independent practice, then adjust scaffolding or challenge accordingly.',
    ],
    English: [
      'Set a measurable language objective for reading, writing, speaking, listening, vocabulary, grammar, literature, or an integrated performance.',
      'Use an appropriate text or model, teach the target skill explicitly, and move from guided practice to independent communication.',
      'Teach vocabulary in context and use sentence frames, glossaries, or language support when they improve access without reducing cognitive demand.',
      'Assess meaning, evidence, organisation, accuracy, audience awareness, and communication with criteria learners can use for self- or peer review.',
    ],
    Science: [
      'Frame the lesson around explaining, predicting, investigating, interpreting evidence, analysing data, or communicating scientific reasoning.',
      'Make practical work clear through a question, prediction, relevant variables, safety expectations, roles, recording method, and evidence-based conclusion.',
      'Use demonstrations, models, annotated diagrams, data interpretation, and misconception checks to connect scientific concepts with observable evidence.',
      'Give learners opportunities to apply scientific understanding to health, environment, technology, or everyday contexts when appropriate.',
    ],
    'Computer Science': [
      'State whether the lesson focuses on computational thinking, algorithms, programming, data, systems, digital technology, or responsible digital practice.',
      'Use decomposition, pattern recognition, abstraction, logical reasoning, and debugging as appropriate to the learner’s age and prior experience.',
      'Give learners opportunities to predict, design, test, explain, and improve a solution rather than only copy code or follow steps.',
      'Plan safe and responsible use of devices, data, online services, and artificial intelligence tools in line with school policy.',
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
      'Teach geographical vocabulary explicitly and connect Indian, local, regional, or global contexts to wider patterns when relevant.',
      'Assess interpretation, application of evidence, explanation of processes, and reasoned conclusions rather than recall alone.',
    ],
    'Social Studies': [
      'Connect civics, society, culture, economics, geography, and history only where the stated objective supports an interdisciplinary view.',
      'Use familiar community, Indian, and global contexts to help learners examine institutions, rights, responsibilities, resources, change, and diverse perspectives.',
      'Plan discussion, source work, data interpretation, role play, or a community-linked task with clear evidence and respectful participation expectations.',
      'Assess understanding, reasoning, evidence use, perspective taking, and communication rather than unsupported opinion or recall alone.',
    ],
  },
};

export const CBSE_PACK = cbsePack;
