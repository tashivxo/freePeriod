export type LessonSectionKey =
  | 'title'
  | 'objectives'
  | 'successCriteria'
  | 'keyConcepts'
  | 'hook'
  | 'mainActivities'
  | 'guidedPractice'
  | 'independentPractice'
  | 'formativeAssessment'
  | 'differentiation'
  | 'realWorldConnections'
  | 'plenary';

export type GenerateRequest = {
  subject: string;
  grade: string;
  curriculum: string;
  duration: number;
  teacherPrompt: string;
  curriculumDocPath: string | null;
  templatePath: string | null;
  modelPreference?: 'claude-opus-4-6' | 'claude-sonnet-4-6' | 'claude-haiku-4-5';
};

export type GenerateStreamEvent =
  | { type: 'status'; message: string }
  | { type: 'section'; key: LessonSectionKey; data: unknown }
  | { type: 'complete'; lessonId: string; usage: { inputTokens: number; outputTokens: number } }
  | { type: 'error'; message: string };
