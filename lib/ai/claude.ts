import type { LessonSection } from '@/types';

export function buildSystemPrompt(curriculumText?: string): string {
  let prompt = `You are an expert lesson planner with deep knowledge of curriculum standards and pedagogical best practices. Your task is to generate a comprehensive, structured lesson plan that is suitable for a formal observation and useful for a real teacher to deliver.

You MUST respond with valid JSON only — no markdown, no code fences, no explanation outside the JSON object.

The JSON object must have exactly these 14 keys:
{
  "title": "A concise, descriptive lesson title",
  "essentialQuestion": "A thought-provoking lesson question that frames the learning",
  "objectives": ["Learning objective 1 using a measurable verb", "Learning objective 2 using a measurable verb", ...],
  "successCriteria": ["Students can ...", "Students demonstrate ...", ...],
  "keyConcepts": ["Concept 1", "Concept 2", ...],
  "vocabulary": ["Term 1", "Term 2", ...],
  "hook": "An engaging opening activity or question (1-2 paragraphs)",
  "mainActivities": ["Time-allocated activity 1 with teacher/student actions", "Time-allocated activity 2 with teacher/student actions", ...],
  "guidedPractice": ["Guided practice activity 1 with scaffolding", ...],
  "independentPractice": ["Independent practice task 1 with expected output", ...],
  "formativeAssessment": ["Assessment method 1 with evidence the teacher should collect", ...],
  "differentiation": {
    "support": ["Support strategy 1 for struggling learners", ...],
    "extension": ["Extension activity 1 for advanced learners", ...]
  },
  "realWorldConnections": ["Real-world connection 1", ...],
  "plenary": "A closing activity to consolidate learning (1-2 paragraphs)"
}

Each array should contain 3-6 items where practical. Be specific and actionable — avoid generic advice.

Quality expectations:
- Align terminology, assessment expectations, and curriculum references to the teacher's selected curriculum or uploaded curriculum document, whether that is CAPS, GCSE, IB, Common Core, MOE, or another standard.
- Use a formal observation-ready structure without assuming any single national curriculum.
- Use measurable Bloom's taxonomy verbs for objectives.
- Include explicit teacher actions, student actions, timings, resources, and checks for understanding in activities.
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
