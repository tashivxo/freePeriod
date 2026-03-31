import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildSystemPrompt, buildUserPrompt, parseLessonContent } from '@/lib/claude/prompts';
import type { LessonSection } from '@/types/database';

type GenerateWithGeminiParams = {
  subject: string;
  grade: string;
  curriculum: string;
  duration: number;
  teacherPrompt: string;
  curriculumText?: string;
};

type GenerateWithGeminiResult = {
  lessonContent: LessonSection;
  tokenCount: number;
};

export async function generateWithGemini(
  params: GenerateWithGeminiParams,
): Promise<GenerateWithGeminiResult> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not set');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const systemInstruction = buildSystemPrompt(params.curriculumText);
  const userPrompt = buildUserPrompt({
    subject: params.subject,
    grade: params.grade,
    curriculum: params.curriculum,
    duration: params.duration,
    teacherPrompt: params.teacherPrompt,
  });

  const result = await model.generateContent({
    systemInstruction,
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
  });

  const text = result.response.text();
  const lessonContent = parseLessonContent(text);

  if (!lessonContent) {
    throw new Error('Failed to parse lesson plan from Gemini response');
  }

  const tokenCount = result.response.usageMetadata?.totalTokenCount ?? 0;

  return { lessonContent, tokenCount };
}
