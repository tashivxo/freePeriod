import type { CurriculumPack } from './types';

export const cambridgeALevelPack: CurriculumPack = {
  id: 'cambridge-a-level',
  curriculumValues: ['A-Level'],
  authority: 'CAMBRIDGE',
  displayName: 'Cambridge International AS & A Level — Guideline Pack',
  coverage: 'guideline',
  lastReviewed: '2026-08-13',
  sourceNotes: [
    'This is a practical planning guideline, not an official Cambridge International document, a verified syllabus, or a reproduction of any Cambridge International AS or A Level syllabus.',
    'Cambridge International’s public Cambridge Advanced programme overview describes the AS & A Level programme and its broad subject offering: https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-advanced/.',
    'Use the current Cambridge International AS & A Level syllabus supplied by the school or teacher for official subject content, Assessment Objectives, assessment requirements, and any required terminology.',
    'This pack deliberately avoids reproducing syllabuses, syllabus codes, paper or component codes, mark schemes, or a complete list of official command words.',
  ],
  applicability: [
    'Use for schools planning with Cambridge International AS and A Level language and lesson structures.',
    'This applies to Cambridge International AS/A Level and is not an AQA, Edexcel, or OCR A-Level guide.',
    'Do not use this pack for another exam board’s specification, a locally authored A-Level programme, or a different national qualification.',
  ],
  uiHelperText:
    'Guideline pack for Cambridge International AS and A Level planning language. Not official or verified. Not AQA, Edexcel, or OCR.',
  terminology: [
    'Name the current Cambridge International AS or A Level subject syllabus supplied by the school when setting the learning intention; do not invent a syllabus reference or outcome code.',
    'Use learning intention, success criteria, modelling, guided practice, independent application, retrieval, misconception, feedback, reflection, and synoptic connection as practical planning language.',
    'Use command words such as state, explain, and evaluate to shape classroom tasks when they suit the intended thinking; this is a practical selection, not a claim to be a complete official list.',
    'If the teacher has uploaded the current syllabus, use only identifiers that appear in it; otherwise describe knowledge, application, and analysis in plain language. Do not invent numbered assessment-objective codes.',
    'Expect students to move beyond recall towards precise explanation, transfer to unfamiliar contexts, interpretation of evidence, evaluation of competing ideas, and sustained independent reasoning.',
    'Keep the cognitive and disciplinary demand high while supporting EAL and ESL learners with pre-taught vocabulary, structured academic talk, exemplars, sentence frames, glossaries, and staged release of responsibility.',
    'Use AS or A Level terminology only when it is supported by the current syllabus or school guidance; do not turn a planning guideline into an invented specification.',
  ],
  assessmentStyle: [
    'Begin with retrieval or a diagnostic task that checks prerequisite knowledge, conceptual relationships, academic language, and readiness for the intended depth.',
    'Make success criteria observable and demanding enough to show the quality of explanation, reasoning, evidence use, communication, or practical performance expected.',
    'Gather evidence through questioning, modelling, guided analysis, discussion, practical work, data interpretation, problem solving, and independent application, then adapt teaching in response.',
    'Use structured written responses, calculations, source analysis, practical records, presentations, or extended arguments according to the subject and learning intention.',
    'Include exam-style practice when it prepares students to apply the current learning, but do not invent mark schemes, grade boundaries, paper structures, component codes, or official scoring rules.',
    'If the teacher uploads the current syllabus, use only assessment language that appears in it; otherwise assess knowledge, application, and analysis in plain language. Do not invent numbered assessment-objective codes.',
    'Use opportunities for students to connect ideas across a topic or course when that supports deeper understanding, without claiming an invented official assessment structure.',
    'End with an exit check, reflection, or short synthesis that identifies secure learning, unresolved questions, and the next reteach, practice, intervention, or extension step.',
    'Give feedback that identifies accurate subject knowledge, quality of reasoning, effective evidence use, and a specific next improvement; build in time for students to act on it.',
  ],
  lessonExpectations: [
    'Write a precise learning intention that identifies the concept, knowledge, method, interpretation, or argument students should demonstrate by the end of the lesson.',
    'Pair the learning intention with concise success criteria that describe the evidence, reasoning, accuracy, independence, and communication expected.',
    'Open with purposeful retrieval, a provocative question, a diagnostic problem, or a relevant context, then make the intellectual purpose of the lesson explicit.',
    'Use explicit teaching and modelling, think aloud about disciplinary decisions, and check understanding before moving from guided analysis or practice to independent application.',
    'Plan questions that probe conceptual understanding, transfer, evidence, assumptions, alternative interpretations, and evaluation rather than relying on recall alone.',
    'Make likely misconceptions, advanced vocabulary, scaffolds, grouping, resources, timings, and planned adaptations visible in the lesson plan.',
    'Support EAL and ESL learners with pre-taught academic and subject vocabulary, clear instructions, visual or worked models, structured talk, and writing frames while maintaining A Level depth.',
    'Build in a substantial independent task such as solving, analysing, investigating, designing, interpreting, or arguing, followed by a deliberate review of the thinking involved.',
    'Use exam-style or real-world application only when it reinforces the learning intention and current syllabus understanding; do not fabricate mark schemes or assessment rules.',
    'Close with reflection, synthesis, or exit evidence that informs the next lesson, independent study, intervention, or extension.',
  ],
  subjectNotes: {
    Mathematics: [
      'State whether the lesson targets conceptual understanding, fluency, proof, modelling, reasoning, problem solving, or a connected progression of these.',
      'Model notation, representations, assumptions, and alternative methods, asking students to justify each step and identify when a method is valid.',
      'Use challenging problems, worked-example comparison, error analysis, and deliberate variation to develop independent mathematical reasoning.',
      'Pre-teach precise mathematical vocabulary and provide structured language for EAL and ESL learners to explain proof, strategy, relationships, and limitations.',
    ],
    English: [
      'Make the learning intention measurable through close reading, interpretation, argument, comparative analysis, writing craft, speaking, listening, or an integrated language performance.',
      'Model how to select and analyse evidence, develop an interpretation, structure an argument, and make deliberate choices for audience and purpose.',
      'Use demanding texts and disciplined discussion with vocabulary previews, glossaries, sentence frames, and staged drafting where they improve access without reducing complexity.',
      'Use success criteria for interpretation, evidence, organisation, style, accuracy, and independent judgement, then provide time for purposeful revision.',
    ],
    Science: [
      'Anchor the lesson in explaining a mechanism, applying a model, interpreting quantitative evidence, planning an investigation, evaluating a method, or communicating a justified conclusion.',
      'Make practical and data-based work explicit about variables, controls, uncertainty, safety, recording, analysis, and the limitations of the evidence.',
      'Use prediction, diagrams, mathematical relationships, unfamiliar data, and evaluation questions to reveal misconceptions and deepen transfer.',
      'Pre-teach scientific and academic vocabulary, response structures, and graph or data conventions so EAL and ESL learners can communicate rigorous scientific reasoning.',
    ],
    'Computer Science': [
      'Make the computational learning intention visible through abstraction, decomposition, algorithms, programming, data structures, systems, networks, or computational problem solving as appropriate.',
      'Model design choices, tracing, testing, debugging, and evaluation, then move from a constrained example to independent construction or critique.',
      'Require students to explain trade-offs, assumptions, efficiency, correctness, and limitations using precise technical language and evidence from test cases.',
      'Support EAL and ESL learners with diagrams, annotated pseudocode, paired rehearsal, and language frames for describing logic and design decisions without simplifying the computational demand.',
    ],
    History: [
      'Frame the lesson around causation, consequence, change and continuity, significance, interpretation, comparison, or the construction of a supported historical judgement.',
      'Model how to interrogate sources and interpretations, select relevant evidence, address limitations, and connect a claim to a coherent line of reasoning.',
      'Use chronology, source comparison, historiographical or interpretive discussion where appropriate, and structured planning before independent extended writing.',
      'Pre-teach historical and academic vocabulary while requiring students to weigh evidence, acknowledge complexity, and communicate a reasoned judgement.',
    ],
    Geography: [
      'Connect the learning intention to geographical concepts, place, processes, patterns, systems, fieldwork, data, human-environment relationships, or evaluation of responses.',
      'Model how to interpret maps, diagrams, photographs, graphs, statistics, and fieldwork evidence, then require students to explain patterns and evaluate conclusions.',
      'Use relevant local, regional, and global examples to deepen transfer, avoiding disconnected case-study detail or any implied official syllabus sequence.',
      'Support EAL and ESL learners with labelled visuals, academic vocabulary, sentence stems, and structured interpretation before independent analysis and evaluation.',
    ],
    Economics: [
      'Frame the lesson around economic concepts, relationships, incentives, models, data interpretation, policy choices, or evaluation of competing outcomes.',
      'Model how to define terms precisely, use diagrams or quantitative evidence, apply a concept to an unfamiliar context, and explain assumptions or limitations.',
      'Use structured discussion and written reasoning that distinguishes description, explanation, application, analysis, and evaluation without inventing an official assessment taxonomy.',
      'Pre-teach economic and academic vocabulary, provide language frames for chains of reasoning, and ask students to reach a justified judgement supported by evidence.',
    ],
  },
};

export const CAMBRIDGE_A_LEVEL_PACK = cambridgeALevelPack;
