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

const RATE_LIMIT_RETRY_DELAY_MS = 5000;
const RATE_LIMIT_MAX_RETRIES = 2;

function isRateLimitError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes('429') ||
      msg.includes('too many requests') ||
      msg.includes('resource_exhausted') ||
      msg.includes('quota')
    );
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

  let lastError: unknown;

  for (let attempt = 0; attempt <= RATE_LIMIT_MAX_RETRIES; attempt++) {
    try {
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
    } catch (err) {
      lastError = err;

      if (isRateLimitError(err) && attempt < RATE_LIMIT_MAX_RETRIES) {
        const delay = RATE_LIMIT_RETRY_DELAY_MS * (attempt + 1);
        console.warn(
          `[gemini] Rate limit hit (attempt ${attempt + 1}/${RATE_LIMIT_MAX_RETRIES}). Retrying in ${delay}ms...`,
        );
        await sleep(delay);
        continue;
      }

      break;
    }
  }

  if (isRateLimitError(lastError)) {
    throw new Error('Generation is busy, retrying... (rate limit reached after retries)');
  }

  throw lastError;
}
