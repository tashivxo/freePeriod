import type { GenerationLocale, LessonSection } from '@/types';

const LOCALE_LANGUAGE_NAMES: Record<GenerationLocale, string> = {
  en: 'English',
  ar: 'Arabic',
  es: 'Spanish',
  fr: 'French',
};

function buildLocaleInstructions(locale?: string): string {
  if (!locale || locale === 'en') return '';

  const languageName = LOCALE_LANGUAGE_NAMES[locale as GenerationLocale] ?? locale;
  let instructions = `\n\nLANGUAGE OUTPUT REQUIREMENTS:
- Write ALL human-readable JSON string VALUES in ${languageName}.
- Keep ALL JSON object KEYS in English exactly as specified above.
- Keep activity-phase field labels in English: "Time:", "Teacher Activity:", "Learner Activity & Success Criteria:", "Formative Assessment:", "Resources:".
- Do NOT translate JSON keys or these field labels. Only translate the content after each label.`;

  if (locale === 'ar') {
    instructions += `\n- Use formal Modern Standard Arabic (الفصحى) suitable for teacher professional documents.
- Preserve curriculum codes and standards identifiers untranslated when they are present in the uploaded curriculum document.
- Do not invent, translate, or infer curriculum codes or standards identifiers.`;
  }

  return instructions;
}

const ACTIVITY_PHASE_FORMAT = `Activity phase format (hook, every mainActivities item, guidedPractice, independentPractice, and plenary):
Each activity phase MUST be a single plain-text string with exactly these five labeled fields, in this order:
Time: [duration, e.g. 10 min]
Teacher Activity: [what the teacher does — 2 to 4 short bullet points, one per line]
Learner Activity & Success Criteria: [what students do PLUS "I can" success criteria tied to the lesson goal — 2 to 4 short bullet points, one per line. Example: "Work in pairs to label the diagram. I can: name all five elements correctly. I can: explain how conflict drives the plot."]
Formative Assessment: [how you check understanding during this phase — 2 to 4 short bullet points]
Resources: [specific materials, platforms, or handouts used in this phase only — e.g. "Whiteboard, printed graphic organiser, PhET simulation link, pupil notebooks"]

For every activity phase you MUST return content for all 5 fields. Empty fields are not acceptable.
If resources are minimal, list at least: "Whiteboard / projector, teacher-created handout".
Success criteria inside Learner Activity & Success Criteria must be written as "I can" statements derived from the lesson objectives and successCriteria for that phase's goal.`;

const PLANNING_FIELD_RULES = `Planning field writing rules (objectives, successCriteria, priorKnowledge, performanceExpectations, misconceptions, sciencePractices, keyConcepts, vocabulary, formativeAssessment, differentiation, realWorldConnections):
- Write complete, teacher-ready content — not skeleton outlines, placeholders, or single-word labels.
- priorKnowledge: 3-5 full sentences describing prerequisite concepts, skills, and experiences students should already have. Explain WHY each prerequisite matters for this lesson.
- performanceExpectations (legacy JSON key for curriculum alignment): Write 2-4 plain-language statements explaining how the lesson aligns to the supplied curriculum guidance. Include a standards identifier ONLY when it appears verbatim in the uploaded curriculum document. Never invent, infer, or guess a code. Without an uploaded document, do not include any standards identifier.
- misconceptions: 2-4 common student misconceptions about this topic, each with a brief note on how the lesson will address it.
- sciencePractices (legacy JSON key for learning and inquiry practices): Write 2-4 subject-appropriate practices aligned to the lesson activities. Do not assume a Science & Engineering Practices framework unless the selected curriculum or subject explicitly uses it.
- keyConcepts: Each item must name the concept AND explain it in 1-2 sentences — not just a label like "Energy" or "Phases".
- vocabulary: Each item must be "Term — student-friendly definition" (e.g. "Phase — a distinct form of matter such as solid, liquid, or gas").
- objectives: Full measurable objective statements using Bloom's taxonomy verbs — complete sentences, not fragments.
- successCriteria, formativeAssessment, differentiation, realWorldConnections: Detailed enough that a substitute teacher could deliver the lesson without guessing.
- Minimum 3 items per array field where applicable.`;

const ACTIVITY_PHASE_RULES = `Activity phase writing rules (hook, mainActivities, guidedPractice, independentPractice, plenary):
- Be directive and scannable within each phase, but still specific enough to teach from.
- No introductory sentences outside the labeled fields. Plain text only inside JSON string values.`;

const WRITING_RULES = `${PLANNING_FIELD_RULES}

${ACTIVITY_PHASE_RULES}

General rules:
- Do not use markdown formatting of any kind. No asterisks, no bold markers (*word* or **word**), no hyphens used as bullet chars, no heading symbols (#). Plain text only inside JSON string values.`;

export function buildSystemPrompt(
  curriculumText?: string,
  locale?: string,
  guidelinePackText?: string,
): string {
  let prompt = `You are an expert lesson planner with deep knowledge of curriculum standards and pedagogical best practices. Your task is to generate a comprehensive, structured lesson plan that is suitable for a formal observation and useful for a real teacher to deliver.

You MUST respond with valid JSON only — no markdown code fences, no explanation outside the JSON object.

The JSON object must have exactly these 18 keys:
{
  "title": "A concise, descriptive lesson title",
  "essentialQuestion": "A thought-provoking lesson question that frames the learning (1-2 complete sentences)",
  "objectives": ["Full measurable learning objective 1", "Full measurable learning objective 2", ...],
  "successCriteria": ["I can ...", "I can ...", ...],
  "priorKnowledge": ["Students should already understand ...", "Students should be able to ...", ...],
  "performanceExpectations": ["Plain-language curriculum alignment statement...", ...],
  "misconceptions": ["Students often think ... — addressed by ...", ...],
  "sciencePractices": ["Subject-appropriate learning or inquiry practice...", ...],
  "keyConcepts": ["Concept name — explanation of what students need to understand", ...],
  "vocabulary": ["Term — student-friendly definition", ...],
  "hook": "Activity phase string with all 5 labeled fields (see format below)",
  "mainActivities": ["Activity phase string with all 5 labeled fields", ...],
  "guidedPractice": ["Activity phase string with all 5 labeled fields", ...],
  "independentPractice": ["Activity phase string with all 5 labeled fields", ...],
  "formativeAssessment": ["Lesson-level formative method 1", "Lesson-level formative method 2", ...],
  "differentiation": {
    "support": ["Support strategy 1 for struggling learners", ...],
    "extension": ["Extension activity 1 for advanced learners", ...]
  },
  "realWorldConnections": ["Real-world connection 1", ...],
  "plenary": "Activity phase string with all 5 labeled fields"
}

${ACTIVITY_PHASE_FORMAT}

${WRITING_RULES}

FORMAT EXAMPLES (bad → good):
- keyConcepts BAD: ["Matter", "Solid", "Gas"] → GOOD: ["States of matter — substances exist as solids, liquids, or gases depending on particle arrangement and energy", "Particle motion — particles vibrate, slide, or move freely depending on the state"]
- vocabulary BAD: ["Solid", "Liquid"] → GOOD: ["Solid — matter with a fixed shape and volume because particles are tightly packed", "Liquid — matter with a fixed volume but no fixed shape because particles can slide past one another"]
- priorKnowledge BAD: [] or ["Matter"] → GOOD: ["Students should already know that all materials are made of matter and can be observed in everyday objects.", "Students should be able to compare basic properties such as shape, volume, and whether a material can be poured or compressed."]
- performanceExpectations BAD: [] or ["Matter"] → GOOD: ["The lesson develops students' ability to explain the topic using the concepts and vocabulary specified in the supplied curriculum guidance.", "Students demonstrate the target learning through the lesson's evidence-based activities and assessment."]

Each array should contain 3-6 items where practical. Be specific and actionable — avoid generic advice.

Quality expectations:
- When an uploaded curriculum document is supplied, align terminology, assessment expectations, and curriculum references to that document.
- Without an uploaded curriculum document, use the selected curriculum name only for broad context. Do not claim code-level alignment and do not generate standards identifiers from memory.
- Use a formal observation-ready structure without assuming any single national curriculum.
- Use measurable Bloom's taxonomy verbs for objectives.
- Write successCriteria at lesson level as "I can" statements; repeat the relevant ones inside each phase's Learner Activity & Success Criteria field.
- Show adaptive teaching: scaffolds for students below standard and extension for high-attaining students.
- Include purposeful technology or AI use only when it directly supports the lesson objective.
- Keep activity phases structured and scannable, but make planning fields substantive enough to teach from without further editing.${buildLocaleInstructions(locale)}`;

  if (curriculumText) {
    prompt += `\n\n--- CURRICULUM DOCUMENT ---\nThe teacher uploaded the following curriculum document. Treat it as the source of truth for curriculum-specific terminology, outcomes, and identifiers.\n- Use only curriculum identifiers that appear verbatim in this document.\n- Do not create, infer, or substitute identifiers from another curriculum.\n- If the document does not contain an identifier relevant to the lesson, write plain-language alignment without a code.\n- Do not present general model knowledge as verified curriculum alignment.\n\n${curriculumText}\n--- END CURRICULUM DOCUMENT ---`;
  }

  if (guidelinePackText) {
    prompt += `\n\n--- CURRICULUM GUIDELINE PACK ---
This is a FreePeriod-authored guideline pack for the selected curriculum. It is not an official curriculum document and is not verified.
Do not invent official standards codes.
Use it for terminology, assessment style, and lesson-structure expectations only.
If a teacher-uploaded curriculum document is also present, that uploaded document remains the only source of identifiers.

${guidelinePackText}
--- END CURRICULUM GUIDELINE PACK ---`;
  }

  return prompt;
}

export function buildUserPrompt(params: {
  subject: string;
  grade: string;
  curriculum: string;
  duration: number;
  teacherPrompt: string;
  locale?: string;
}): string {
  let prompt = `Create a lesson plan with the following details:
- Subject: ${params.subject}
- Grade: ${params.grade}
- Duration: ${params.duration} minutes`;

  if (params.locale && params.locale !== 'en') {
    const languageName = LOCALE_LANGUAGE_NAMES[params.locale as GenerationLocale] ?? params.locale;
    prompt += `\n- Output language: ${languageName} (${params.locale})`;
  }

  if (params.curriculum) {
    prompt += `\n- Curriculum/Standard: ${params.curriculum}`;
  }

  if (params.teacherPrompt) {
    prompt += `\n\nTeacher's additional instructions:\n${params.teacherPrompt}`;
  }

  return prompt;
}

export function parseLessonContent(text: string): LessonSection | null {
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonSource = cleaned.startsWith('{') ? cleaned : cleaned.match(/\{[\s\S]*\}/)?.[0];
    if (!jsonSource) return null;

    const parsed = JSON.parse(jsonSource);

    if (!parsed.title || !parsed.objectives) return null;

    return {
      title: String(parsed.title),
      essentialQuestion: String(parsed.essentialQuestion ?? ''),
      objectives: Array.isArray(parsed.objectives) ? parsed.objectives.map(String) : [],
      successCriteria: Array.isArray(parsed.successCriteria) ? parsed.successCriteria.map(String) : [],
      priorKnowledge: Array.isArray(parsed.priorKnowledge) ? parsed.priorKnowledge.map(String) : [],
      performanceExpectations: Array.isArray(parsed.performanceExpectations)
        ? parsed.performanceExpectations.map(String)
        : [],
      misconceptions: Array.isArray(parsed.misconceptions) ? parsed.misconceptions.map(String) : [],
      sciencePractices: Array.isArray(parsed.sciencePractices) ? parsed.sciencePractices.map(String) : [],
      keyConcepts: Array.isArray(parsed.keyConcepts) ? parsed.keyConcepts.map(String) : [],
      vocabulary: Array.isArray(parsed.vocabulary) ? parsed.vocabulary.map(String) : [],
      hook: String(parsed.hook ?? ''),
      mainActivities: Array.isArray(parsed.mainActivities) ? parsed.mainActivities.map(String) : [],
      guidedPractice: Array.isArray(parsed.guidedPractice) ? parsed.guidedPractice.map(String) : [],
      independentPractice: Array.isArray(parsed.independentPractice) ? parsed.independentPractice.map(String) : [],
      formativeAssessment: Array.isArray(parsed.formativeAssessment) ? parsed.formativeAssessment.map(String) : [],
      differentiation: {
        support: Array.isArray(parsed.differentiation?.support) ? parsed.differentiation.support.map(String) : [],
        extension: Array.isArray(parsed.differentiation?.extension) ? parsed.differentiation.extension.map(String) : [],
      },
      realWorldConnections: Array.isArray(parsed.realWorldConnections) ? parsed.realWorldConnections.map(String) : [],
      plenary: String(parsed.plenary ?? ''),
    };
  } catch {
    return null;
  }
}
