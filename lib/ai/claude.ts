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

const WRITING_RULES = `Writing rules:
- Be concise. Every labeled field uses 2 to 4 short bullet points maximum (one bullet per line).
- No introductory sentences. No paragraph prose. Key information only.
- Write as a teacher would write in a lesson plan — short, directive, scannable.
- Do not use markdown formatting of any kind. No asterisks, no bold markers (*word* or **word**), no hyphens used as bullet chars, no heading symbols (#). Plain text only inside JSON string values.`;

export function buildSystemPrompt(curriculumText?: string): string {
  let prompt = `You are an expert lesson planner with deep knowledge of curriculum standards and pedagogical best practices. Your task is to generate a comprehensive, structured lesson plan that is suitable for a formal observation and useful for a real teacher to deliver.

You MUST respond with valid JSON only — no markdown code fences, no explanation outside the JSON object.

The JSON object must have exactly these 14 keys:
{
  "title": "A concise, descriptive lesson title",
  "essentialQuestion": "A thought-provoking lesson question that frames the learning",
  "objectives": ["Learning objective 1 using a measurable verb", "Learning objective 2 using a measurable verb", ...],
  "successCriteria": ["I can ...", "I can ...", ...],
  "keyConcepts": ["Concept 1", "Concept 2", ...],
  "vocabulary": ["Term 1", "Term 2", ...],
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

Each array should contain 3-6 items where practical. Be specific and actionable — avoid generic advice.

Quality expectations:
- Align terminology, assessment expectations, and curriculum references to the teacher's selected curriculum or uploaded curriculum document, whether that is CAPS, GCSE, IB, Common Core, MOE, or another standard.
- Use a formal observation-ready structure without assuming any single national curriculum.
- Use measurable Bloom's taxonomy verbs for objectives.
- Write successCriteria at lesson level as "I can" statements; repeat the relevant ones inside each phase's Learner Activity & Success Criteria field.
- Show adaptive teaching: scaffolds for students below standard and extension for high-attaining students.
- Include purposeful technology or AI use only when it directly supports the lesson objective.
- Keep the output concise enough to fit into a teacher's downloadable plan, but detailed enough to teach from.`;

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
    const parsed = JSON.parse(cleaned);

    if (!parsed.title || !parsed.objectives) return null;

    return {
      title: String(parsed.title),
      essentialQuestion: String(parsed.essentialQuestion ?? ''),
      objectives: Array.isArray(parsed.objectives) ? parsed.objectives.map(String) : [],
      successCriteria: Array.isArray(parsed.successCriteria) ? parsed.successCriteria.map(String) : [],
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
