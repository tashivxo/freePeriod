import Anthropic from '@anthropic-ai/sdk';
import {
  buildSystemPrompt,
  buildUserPrompt,
  generateWithGemini,
  GEMINI_FREE_MODEL,
  parseLessonContent,
} from '@/lib/ai';
import type { LessonSection } from '@/types';

const ALLOWED_MODELS = ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5'] as const;
export type AllowedModel = (typeof ALLOWED_MODELS)[number];

function isAllowedModel(model: string): model is AllowedModel {
  return (ALLOWED_MODELS as readonly string[]).includes(model);
}

export type GenerateContentInput = {
  isFreePlan: boolean;
  modelPreference?: string;
  subject: string;
  grade: string;
  curriculum: string;
  duration: number;
  teacherPrompt: string;
  curriculumText?: string;
};

export type GenerateContentResult = {
  lessonContent: LessonSection;
  inputTokens: number;
  outputTokens: number;
  modelUsed: string;
};

export async function generateLessonContent(input: GenerateContentInput): Promise<GenerateContentResult> {
  const {
    isFreePlan,
    modelPreference,
    subject,
    grade,
    curriculum,
    duration,
    teacherPrompt,
    curriculumText,
  } = input;

  const claudeModel: AllowedModel =
    !isFreePlan && modelPreference && isAllowedModel(modelPreference)
      ? modelPreference
      : 'claude-sonnet-4-6';
  const modelUsed = isFreePlan ? GEMINI_FREE_MODEL : claudeModel;

  if (isFreePlan) {
    const geminiResult = await generateWithGemini({
      subject,
      grade,
      curriculum,
      duration,
      teacherPrompt,
      curriculumText,
    });

    return {
      lessonContent: geminiResult.lessonContent,
      inputTokens: geminiResult.tokenCount,
      outputTokens: 0,
      modelUsed,
    };
  }

  const systemPrompt = buildSystemPrompt(curriculumText);
  const userPrompt = buildUserPrompt({ subject, grade, curriculum, duration, teacherPrompt });
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const messageStream = anthropic.messages.stream({
    model: claudeModel,
    max_tokens: 4096,
    thinking: { type: 'adaptive' },
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userPrompt }],
  });

  let fullText = '';
  messageStream.on('text', (text) => {
    fullText += text;
  });

  const finalMessage = await messageStream.finalMessage();
  const parsed = parseLessonContent(fullText);
  if (!parsed) {
    throw new Error('Failed to parse lesson plan from Claude response');
  }

  return {
    lessonContent: parsed,
    inputTokens: finalMessage.usage.input_tokens,
    outputTokens: finalMessage.usage.output_tokens,
    modelUsed,
  };
}
