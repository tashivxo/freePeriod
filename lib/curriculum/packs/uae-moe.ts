import type { CurriculumPack } from './types';

export const uaeMoePack: CurriculumPack = {
  id: 'uae-moe',
  curriculumValues: ['UAE MOE'],
  authority: 'UAE_MOE',
  displayName: 'UAE MOE — Guideline Pack',
  coverage: 'guideline',
  lastReviewed: '2026-08-13',
  sourceNotes: [
    'This is a practical guideline for UAE MOE-aligned planning, not a reproduction of an official curriculum or a substitute for the current school-issued standards.',
    'The Ministry of Education About Ministry page describes national learning standards, an assessment-for-learning approach, creativity and innovation, and 21st-century skills: https://www.moe.gov.ae/en/about-us/pages/about-ministry.aspx.',
    'The MOE Inclusive Education Policy page describes shared learning environments, targeted support, barrier removal, Individual Education Plans, and ongoing review for students of determination: https://moe.gov.ae/en/about-us/legislations/Pages/inclusive-education-policy-ministerial-resolution-647-2020-uae.aspx.',
    'Use the current school-issued MOE subject standards and daily-plan template as the source of official codes and required fields.',
    'The MOE public education-platform announcement identifies Arabic, Mathematics, Science, Islamic Studies, Social Studies, and English as core subjects and describes lesson-level feedback: https://www.moe.gov.ae/En/MediaCenter/News/Pages/AlefPlatforminallUAEPublic.aspx.',
  ],
  applicability: [
    'Dubai and the Northern Emirates commonly use UAE MOE curriculum documents in school planning.',
    'Abu Dhabi public schools also follow the national MOE curriculum; ADEK regulates schools there and is a separate guideline pack.',
  ],
  uiHelperText:
    'Guideline pack for UAE Ministry of Education planning language. Not official or verified. Common in Dubai and the Northern Emirates; Abu Dhabi public schools also follow MOE curriculum under ADEK regulation.',
  terminology: [
    'Use content standards, performance standards, and learning outcomes as planning anchors when the school provides the relevant current standards.',
    'Use assessment for learning to describe evidence gathered during instruction and the teaching decision that follows it.',
    'Use active learning, student-centred learning, creativity, innovation, and problem solving where they accurately describe the lesson.',
    'Use 21st-century skills language such as communication, collaboration, critical thinking, creativity, digital literacy, and self-management.',
    'Use students of determination and inclusive education when discussing access, targeted support, accommodations, and participation.',
    'Use national identity, UAE values, sustainability, and responsible citizenship only when they are genuinely connected to the learning.',
  ],
  assessmentStyle: [
    'Begin with a brief diagnostic or retrieval check so the teacher can identify readiness and misconceptions.',
    'Collect visible evidence during the lesson through questioning, observation, mini-whiteboards, think-pair-share, practical work, or a short written response.',
    'State success criteria in student-friendly, observable language and revisit them before the final check.',
    'Use exit evidence to record who is secure, who needs targeted support, and which concept needs reteaching.',
    'Plan a proportionate remedial response for learners who are not yet secure and an extension or enrichment response for learners who are ready to go further.',
    'Keep assessment records useful for next-step planning rather than treating a single score as the whole picture of progress.',
  ],
  lessonExpectations: [
    'Write one or more measurable objectives that identify the knowledge, skill, or understanding students will demonstrate by the end of the lesson.',
    'Make the success criteria observable, concise, and directly matched to the objectives; include the quality or conditions expected where useful.',
    'Open with a purposeful hook, retrieval task, or diagnostic question, then make the learning intention and relevance explicit.',
    'Model the new learning, use guided practice, and provide a clear transition to independent or collaborative application.',
    'Plan purposeful questioning that checks understanding, exposes misconceptions, and gives quieter learners structured opportunities to respond.',
    'Show planned differentiation through scaffolds, vocabulary or language support, accessible resources, flexible grouping, and appropriate challenge.',
    'End with an assessment-for-learning check that informs the next lesson, intervention, homework, or enrichment rather than merely closing the period.',
    'Keep the plan observation-ready by naming the teacher actions, student actions, resources, timings, checks for understanding, and adaptations.',
    'Use Arabic and English deliberately according to the subject and school language policy; pre-teach essential bilingual vocabulary without turning translation into the sole learning activity.',
  ],
  subjectNotes: {
    Science: [
      'Frame objectives around explaining, predicting, investigating, analysing evidence, and communicating scientific reasoning.',
      'Use practical or data-based tasks with explicit safety expectations, roles, recording methods, and a conclusion linked to evidence.',
      'Pre-teach key scientific terms in English and Arabic when relevant, while requiring students to use precise scientific language in the response language.',
      'Assess misconceptions with prediction questions, annotated diagrams, hinge questions, and evidence-based explanations.',
    ],
    Mathematics: [
      'State whether the objective targets fluency, conceptual understanding, reasoning, problem solving, or a deliberate combination.',
      'Model more than one representation or strategy and ask students to explain why a method works, not only reproduce steps.',
      'Use worked examples, deliberate practice, and carefully sequenced challenge; allow Arabic discussion where it improves access while eliciting mathematical vocabulary in the target language.',
      'Use diagnostic questions and error analysis to identify misconceptions before assigning independent practice.',
    ],
    English: [
      'Make the language objective measurable through a specific reading, writing, speaking, listening, vocabulary, or grammar performance.',
      'Use a short authentic or age-appropriate text, model the target skill, and provide guided practice before independent production.',
      'Teach vocabulary in context and provide sentence frames or bilingual glossaries when they remove a language barrier without reducing cognitive demand.',
      'Assess meaning, evidence, organisation, accuracy, and audience awareness with success criteria that students can use for self- or peer review.',
    ],
    Arabic: [
      'Connect reading, writing, speaking, and listening objectives to vocabulary, comprehension, language accuracy, and communication purpose.',
      'Use explicit modelling of morphology, syntax, spelling, handwriting, or text structure when those features are part of the objective.',
      'Use culturally relevant texts and UAE context sensitively while preserving opportunities for interpretation, discussion, and independent expression.',
      'Allow structured comparison with English when it clarifies meaning or language transfer, but assess the intended Arabic outcome in Arabic.',
    ],
    'Islamic Education': [
      'Set objectives around accurate understanding, reflection, application of values, and respectful communication rather than recall alone.',
      'Use age-appropriate source material and clarify key Arabic terms before students explain meaning or relevance in their own words.',
      'Plan discussion and scenarios that connect learning to ethical decision making, personal responsibility, and respectful conduct.',
      'Check understanding through explanation, application, and reflection, while handling religious content with accuracy and sensitivity.',
    ],
    'Social Studies': [
      'Use UAE history, geography, society, economy, identity, and civic responsibility as relevant contexts rather than adding disconnected facts.',
      'Ask students to interpret maps, timelines, sources, data, or perspectives and support conclusions with evidence.',
      'Teach important Arabic and English civic or disciplinary vocabulary explicitly when bilingual access is needed.',
      'Assess chronology, significance, comparison, source use, and reasoned communication through short written, oral, or visual products.',
    ],
  },
};

export const UAE_MOE_PACK = uaeMoePack;
