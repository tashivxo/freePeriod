import type { LessonSection } from '@/types';

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
- performanceExpectations: Full curriculum-aligned performance expectation statements. When the curriculum document provides a code (e.g. MS-PS1-4, 5-PS1-1), include it AND a plain-language explanation of what students will demonstrate. Each item should be 1-2 complete sentences.
- misconceptions: 2-4 common student misconceptions about this topic, each with a brief note on how the lesson will address it.
- sciencePractices: 2-4 specific Science & Engineering Practices (e.g. "Developing and using models to represent particle motion") aligned to the lesson activities.
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

export function buildSystemPrompt(curriculumText?: string): string {
  let prompt = `You are an expert lesson planner with deep knowledge of curriculum standards and pedagogical best practices. Your task is to generate a comprehensive, structured lesson plan that is suitable for a formal observation and useful for a real teacher to deliver.

You MUST respond with valid JSON only — no markdown code fences, no explanation outside the JSON object.

The JSON object must have exactly these 18 keys:
{
  "title": "A concise, descriptive lesson title",
  "essentialQuestion": "A thought-provoking lesson question that frames the learning (1-2 complete sentences)",
  "objectives": ["Full measurable learning objective 1", "Full measurable learning objective 2", ...],
  "successCriteria": ["I can ...", "I can ...", ...],
  "priorKnowledge": ["Students should already understand ...", "Students should be able to ...", ...],
  "performanceExpectations": ["CODE-123: Full performance expectation statement with explanation", ...],
  "misconceptions": ["Students often think ... — addressed by ...", ...],
  "sciencePractices": ["Developing and using models to ...", "Analyzing data to ...", ...],
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
- performanceExpectations BAD: [] or ["Matter"] → GOOD: ["5-PS1-1: Develop a model to describe that matter is made of particles too small to be seen.", "MS-PS1-4: Develop a model that predicts and describes changes in particle motion, temperature, and state when thermal energy is added or removed."]

Each array should contain 3-6 items where practical. Be specific and actionable — avoid generic advice.

Quality expectations:
- Align terminology, assessment expectations, and curriculum references to the teacher's selected curriculum or uploaded curriculum document, whether that is CAPS, GCSE, IB, Common Core, MOE, or another standard.
- Use a formal observation-ready structure without assuming any single national curriculum.
- Use measurable Bloom's taxonomy verbs for objectives.
- Write successCriteria at lesson level as "I can" statements; repeat the relevant ones inside each phase's Learner Activity & Success Criteria field.
- Show adaptive teaching: scaffolds for students below standard and extension for high-attaining students.
- Include purposeful technology or AI use only when it directly supports the lesson objective.
- Keep activity phases structured and scannable, but make planning fields substantive enough to teach from without further editing.`;

  if (curriculumText) {
    prompt += `\n\n--- CURRICULUM DOCUMENT ---\nThe teacher uploaded the following curriculum document. Use it to align the lesson objectives, activities, and assessments with their specific curriculum requirements:\n\n${curriculumText}\n--- END CURRICULUM DOCUMENT ---`;
  }

  return prompt;
}

export function buildUserPrompt(params: {
  subject: string;
  grade: string;
  curriculum: string;
  duration: number;
  teacherPrompt: string;
}): string {
  let prompt = `Create a lesson plan with the following details:
- Subject: ${params.subject}
- Grade: ${params.grade}
- Duration: ${params.duration} minutes`;

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
