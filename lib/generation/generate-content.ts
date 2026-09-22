import Anthropic from '@anthropic-ai/sdk';
import {
  buildSystemPrompt,
  buildUserPrompt,
  generateWithGemini,
  GEMINI_FREE_MODEL,
  parseLessonContent,
} from '@/lib/ai';
import { formatCurriculumPackForPrompt, getCurriculumPack } from '@/lib/curriculum/packs';
import { finalizeLessonContent } from '@/lib/ai/lesson-content-quality';
import type { LessonSection } from '@/types';

export const QUALITY_CLAUDE_MODEL = 'claude-sonnet-4-6';
export const QUALITY_MAX_TOKENS = 8192;
export const QUALITY_THINKING = { type: 'disabled' as const };
export const QUALITY_OUTPUT_CONFIG = { effort: 'medium' as const };
/** Teacher prompt + uploaded curriculum text at or above this uses low effort. */
export const QUALITY_LOW_EFFORT_USER_CHARS = 80_000;

export type QualityOutputConfig = { effort: 'low' | 'medium' };

export function resolveQualityOutputConfig(userText: {
  teacherPrompt: string;
  curriculumText?: string;
}): QualityOutputConfig {
  const userChars = userText.teacherPrompt.length + (userText.curriculumText?.length ?? 0);
  if (userChars >= QUALITY_LOW_EFFORT_USER_CHARS) {
    return { effort: 'low' };
  }
  return QUALITY_OUTPUT_CONFIG;
}

export function shouldGenerateWithGemini(mode: 'fast' | 'quality'): boolean {
  return mode === 'fast';
}

export type GenerateContentInput = {
  generationMode: 'fast' | 'quality';
  modelPreference?: string;
  subject: string;
  grade: string;
  curriculum: string;
  duration: number;
  teacherPrompt: string;
  curriculumText?: string;
  locale?: string;
};

export type GenerateContentResult = {
  lessonContent: LessonSection;
  inputTokens: number;
  outputTokens: number;
  modelUsed: string;
};

export async function generateLessonContent(input: GenerateContentInput): Promise<GenerateContentResult> {
  const {
    generationMode,
    subject,
    grade,
    curriculum,
    duration,
    teacherPrompt,
    curriculumText,
    locale,
  } = input;

  const useGemini = shouldGenerateWithGemini(generationMode);
  const modelUsed = useGemini ? GEMINI_FREE_MODEL : QUALITY_CLAUDE_MODEL;
  const pack = getCurriculumPack(curriculum);
  const guidelinePackText = pack
    ? formatCurriculumPackForPrompt(pack, subject, grade)
    : undefined;

  if (useGemini) {
    const geminiResult = await generateWithGemini({
      subject,
      grade,
      curriculum,
      duration,
      teacherPrompt,
      curriculumText,
      locale,
      guidelinePackText,
    });

    return {
      lessonContent: geminiResult.lessonContent,
      inputTokens: geminiResult.tokenCount,
      outputTokens: 0,
      modelUsed,
    };
  }

  const systemPrompt = buildSystemPrompt(curriculumText, locale, guidelinePackText);
  const userPrompt = buildUserPrompt({ subject, grade, curriculum, duration, teacherPrompt, locale });
  const outputConfig = resolveQualityOutputConfig({ teacherPrompt, curriculumText });
  if (outputConfig.effort === 'low') {
    console.info('[generateLessonContent] Large user input; using low effort', {
      userChars: teacherPrompt.length + (curriculumText?.length ?? 0),
    });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }
  const anthropic = new Anthropic({ apiKey });

  const messageStream = anthropic.messages.stream({
    model: QUALITY_CLAUDE_MODEL,
    max_tokens: QUALITY_MAX_TOKENS,
    thinking: QUALITY_THINKING,
    output_config: outputConfig,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userPrompt }],
  } as Parameters<typeof anthropic.messages.stream>[0] & {
    output_config: QualityOutputConfig;
  });

  const finalMessage = await messageStream.finalMessage();
  const fullText = finalMessage.content
    .filter((block): block is Anthropic.Messages.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
  const parsed = parseLessonContent(fullText);
  if (!parsed) {
    console.error('[generateLessonContent] Failed to parse Claude response', {
      model: QUALITY_CLAUDE_MODEL,
      stopReason: finalMessage.stop_reason,
      preview: fullText.slice(0, 500),
      length: fullText.length,
      outputTokens: finalMessage.usage.output_tokens,
    });
    throw new Error('Failed to parse lesson plan from Claude response');
  }

  const lessonContent = await finalizeLessonContent(parsed, {
    title: parsed.title,
    curriculumText,
  });

  return {
    lessonContent,
    inputTokens: finalMessage.usage.input_tokens,
    outputTokens: finalMessage.usage.output_tokens,
    modelUsed,
  };
}
