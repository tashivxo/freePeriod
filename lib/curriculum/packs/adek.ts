import type { CurriculumPack } from './types';

export const adekPack: CurriculumPack = {
  id: 'adek',
  curriculumValues: ['ADEK (Abu Dhabi)'],
  authority: 'ADEK',
  displayName: 'ADEK (Abu Dhabi) — Guideline Pack',
  coverage: 'guideline',
  lastReviewed: '2026-08-13',
  sourceNotes: [
    'This is a practical ADEK-aligned planning guideline, not a single Abu Dhabi curriculum and not a reproduction of any school or regulator document.',
    'ADEK describes itself as the Abu Dhabi education-sector regulator responsible for policies, educational standards, and evaluating school quality through compliance and inspections: https://www.adek.gov.ae/en/About/About-Us.',
    'ADEK’s Private Schools overview describes regulation, monitoring of student progress, organisation of teaching and learning, teacher competency, inclusive and flexible school policies, and public school-performance transparency: https://www.adek.gov.ae/en/Education-System/Private-Schools.',
    'ADEK publishes education policies separately from the private-school overview; schools should check the current policy pages and their approved curriculum before treating a planning detail as a requirement: https://www.adek.gov.ae/en/Education-System/Education-Policies.',
    'The MOE public About Ministry page is a useful cross-system reference for assessment for learning, national learning standards, creativity, innovation, and 21st-century skills, but ADEK schools must follow their approved curriculum and current ADEK requirements: https://www.moe.gov.ae/en/about-us/pages/about-ministry.aspx.',
  ],
  applicableEmirates: [
    'Abu Dhabi. ADEK regulates schools there; public schools still follow the national MOE curriculum.',
    'Use this pack for ADEK school-quality and inspection language, not as a replacement for MOE subject standards.',
  ],
  terminology: [
    'Name the school’s approved curriculum or programme alongside ADEK when writing a plan; ADEK regulates Abu Dhabi education but does not make every private school use one identical subject sequence.',
    'Use learning objectives, success criteria, progress, assessment for learning, inclusion, and next steps as common planning language.',
    'Use student-centred learning, active learning, enquiry, communication, collaboration, critical thinking, creativity, digital literacy, and self-management when evidenced by the lesson.',
    'Use students of determination, reasonable adjustments, targeted support, and inclusive participation when planning access.',
    'Use UAE identity, culture, heritage, sustainability, and responsible citizenship where the approved curriculum and lesson context support the connection.',
    'Distinguish a school’s internal inspection or quality-assurance language from ADEK requirements unless the current ADEK policy explicitly confirms the requirement.',
  ],
  assessmentStyle: [
    'Start with a low-stakes diagnostic that reveals prerequisite knowledge, language needs, or misconceptions.',
    'Gather evidence throughout the lesson through questioning, observation, conferencing, peer explanation, practical performance, or short written responses.',
    'Share success criteria in accessible language and give students a chance to use them for self-assessment or peer feedback.',
    'Adapt the task, grouping, scaffold, pace, or explanation in response to evidence rather than waiting for an end-of-unit result.',
    'Use a concise exit check to identify secure learning, partial understanding, and the next planned response for each group of learners.',
    'Plan intervention, reasonable adjustments, and enrichment in ways that preserve high expectations and meaningful participation.',
    'Record evidence in the format required by the school or approved curriculum, avoiding invented ADEK outcome codes or unsupported labels.',
  ],
  lessonExpectations: [
    'Identify the approved curriculum objective or school learning intention and write it as a measurable student performance.',
    'Pair the objective with two to four observable success criteria that make quality and independence clear.',
    'Structure the lesson as purposeful entry or retrieval, explicit teaching or modelling, guided practice, independent or collaborative application, and reflection or exit evidence.',
    'Make teacher questioning, student talk, checks for understanding, and likely misconceptions visible in the plan so an observer can see how learning is monitored.',
    'Plan differentiation through accessible language, chunked instructions, visuals, worked examples, flexible grouping, assistive tools, and extension that increases depth rather than only volume.',
    'Include a specific response to evidence: reteach, regroup, provide a scaffold, adjust the task, or move learners to a deeper application.',
    'Keep resources, timings, safety, transitions, and student roles explicit enough that the lesson can be delivered consistently and reviewed afterwards.',
    'Use Arabic and English in line with the school’s language-of-instruction policy; pre-teach bilingual vocabulary and allow strategic language support while keeping the intended cognitive and subject demand high.',
    'Connect learning to UAE context, wellbeing, inclusion, sustainability, or future-ready skills only when the connection is authentic and supports the objective.',
  ],
  subjectNotes: {
    Science: [
      'Anchor the lesson in a disciplinary objective such as explaining a mechanism, planning an investigation, interpreting evidence, or evaluating a claim.',
      'Make practical work observation-ready with a question, prediction, variables, safety routine, roles, recording method, and evidence-based conclusion.',
      'Pre-teach essential scientific vocabulary in Arabic and English where relevant, then require students to use the precise terms in explanations.',
      'Use hinge questions, annotated models, data interpretation, and misconception checks to decide whether to reteach or extend.',
    ],
    Mathematics: [
      'Specify whether the intended learning is fluency, conceptual understanding, reasoning, problem solving, or a connected progression of these.',
      'Use representations, manipulatives, worked examples, and multiple strategies to make thinking visible before independent application.',
      'Use bilingual discussion strategically when it improves access, while explicitly developing the mathematical vocabulary required by the approved programme.',
      'Use error analysis and hinge questions to identify misconceptions and adapt grouping or task difficulty in the lesson.',
    ],
    English: [
      'Write a measurable language objective for reading, writing, speaking, listening, vocabulary, grammar, or an integrated performance.',
      'Model the target skill with an appropriate text or example, then move from guided practice to independent communication for a real audience or purpose.',
      'Use vocabulary previews, sentence frames, bilingual glossaries, and accessible texts as scaffolds without lowering the intellectual demand.',
      'Make feedback criteria visible for meaning, evidence, organisation, accuracy, and audience so students can revise their work.',
    ],
    Arabic: [
      'Plan integrated Arabic-language learning across comprehension, oral communication, vocabulary, grammar, reading fluency, and writing as appropriate.',
      'Model the specific language feature or text structure and provide guided practice before asking students to create or interpret independently.',
      'Use culturally responsive and age-appropriate Arabic texts that support identity, curiosity, discussion, and precise expression.',
      'Use English comparisons only when they clarify a language feature or support transfer, while assessing the intended Arabic outcome in Arabic.',
    ],
    'Islamic Education': [
      'Write objectives that move from accurate understanding toward reflection, ethical application, respectful dialogue, and responsible action.',
      'Clarify essential Arabic terminology and use age-appropriate, accurate source material without turning the lesson into unsupported quotation or memorisation.',
      'Use scenarios, structured discussion, and reflection to connect concepts with conduct, empathy, responsibility, and community life.',
      'Assess explanation and application as well as recall, and handle differences in prior knowledge respectfully and sensitively.',
    ],
    'Social Studies': [
      'Use Abu Dhabi and UAE contexts where relevant, while connecting local identity and heritage to geography, history, society, economy, and civic responsibility.',
      'Teach students to interpret maps, timelines, data, artefacts, and sources, and to distinguish evidence from opinion.',
      'Pre-teach important Arabic and English disciplinary vocabulary so language access does not obscure historical or civic reasoning.',
      'Assess comparison, chronology, significance, source use, and reasoned communication through short written, oral, visual, or digital products.',
    ],
  },
};

export const ADEK_PACK = adekPack;
