import type { LessonSection } from '@/types/database';

export function buildSystemPrompt(curriculumText?: string): string {
  let prompt = `You are an expert lesson planner with deep knowledge of curriculum standards and pedagogical best practices. Your task is to generate a comprehensive, structured lesson plan.

You MUST respond with valid JSON only — no markdown, no code fences, no explanation outside the JSON object.

The JSON object must have exactly these 12 keys:
{
  "title": "A concise, descriptive lesson title",
  "objectives": ["Learning objective 1", "Learning objective 2", ...],
  "successCriteria": ["Students can ...", "Students demonstrate ...", ...],
  "keyConcepts": ["Concept 1", "Concept 2", ...],
  "hook": "An engaging opening activity or question (1-2 paragraphs)",
  "mainActivities": ["Activity 1 description", "Activity 2 description", ...],
  "guidedPractice": ["Guided practice activity 1", ...],
  "independentPractice": ["Independent practice task 1", ...],
  "formativeAssessment": ["Assessment method 1", ...],
  "differentiation": {
    "support": ["Support strategy 1 for struggling learners", ...],
    "extension": ["Extension activity 1 for advanced learners", ...]
  },
  "realWorldConnections": ["Real-world connection 1", ...],
  "plenary": "A closing activity to consolidate learning (1-2 paragraphs)"
}

Each array should contain 2-5 items. Be specific and actionable — avoid generic advice.`;

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
      objectives: Array.isArray(parsed.objectives) ? parsed.objectives.map(String) : [],
      successCriteria: Array.isArray(parsed.successCriteria) ? parsed.successCriteria.map(String) : [],
      keyConcepts: Array.isArray(parsed.keyConcepts) ? parsed.keyConcepts.map(String) : [],
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
