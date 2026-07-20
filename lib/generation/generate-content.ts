import Anthropic from '@anthropic-ai/sdk';
import {
  buildSystemPrompt,
  buildUserPrompt,
  generateWithGemini,
  GEMINI_FREE_MODEL,
  parseLessonContent,
} from '@/lib/ai';
import {
  finalizeLessonContent,
  parsePlanningFieldPatch,
} from '@/lib/ai/lesson-content-quality';
import type { LessonSection } from '@/types';

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
  } = input;

  const useGemini = shouldGenerateWithGemini(generationMode);
  const claudeModel = 'claude-sonnet-4-6';
  const modelUsed = useGemini ? GEMINI_FREE_MODEL : claudeModel;

  if (useGemini) {
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
    max_tokens: 16384,
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

  const finalMessage = await messageStream.finalMessage();
  const fullText = finalMessage.content
    .filter((block): block is Anthropic.Messages.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
  const parsed = parseLessonContent(fullText);
  if (!parsed) {
    console.error('[generateLessonContent] Failed to parse Claude response', {
      model: claudeModel,
      stopReason: finalMessage.stop_reason,
      preview: fullText.slice(0, 500),
      length: fullText.length,
      outputTokens: finalMessage.usage.output_tokens,
    });
    throw new Error('Failed to parse lesson plan from Claude response');
  }

  const lessonContent = await finalizeLessonContent(parsed, {
    title: parsed.title,
    retry: async (retryPrompt) => {
      const retryMessage = await anthropic.messages.create({
        model: claudeModel,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt },
          { role: 'assistant', content: fullText },
          { role: 'user', content: retryPrompt },
        ],
      });
      const retryText = retryMessage.content
        .filter((block): block is Anthropic.Messages.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('\n')
        .trim();
      return parsePlanningFieldPatch(retryText);
    },
  });

  return {
    lessonContent,
    inputTokens: finalMessage.usage.input_tokens,
    outputTokens: finalMessage.usage.output_tokens,
    modelUsed,
  };
}
