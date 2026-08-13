import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GEMINI_FREE_MODEL } from '@/lib/ai/gemini';
import { resolveGenerationAccess } from '@/lib/generation/authorize';
import { generateLessonContent } from '@/lib/generation/generate-content';
import { resolveGenerationMode } from '@/lib/generation/quota';
import { mapGenerationError } from '@/lib/generation/map-error';
import { persistLessonPlan } from '@/lib/generation/persist';
import { encodeSSE } from '@/lib/generation/sse';
import { LESSON_SECTION_KEYS } from '@/lib/lesson/sections';
import type { GenerateRequest, GenerateStreamEvent, GenerationLocale } from '@/types';
import { GENERATION_LOCALES } from '@/types';

function resolveLocale(raw?: string): GenerationLocale {
  if (raw && GENERATION_LOCALES.includes(raw as GenerationLocale)) {
    return raw as GenerationLocale;
  }
  return 'en';
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const access = await resolveGenerationAccess(supabase, user.id);

  if (access.isRateLimited) {
    const message =
      access.userPlan === 'pro'
        ? 'You have used all 20 lesson plans for this billing period. Upgrade to Pro+ for unlimited generations.'
        : 'You have used all 3 free lesson plans for this month. Upgrade to generate more.';
    return new Response(JSON.stringify({ error: message }), {
      status: 402,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: GenerateRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { subject, grade, curriculum, duration, teacherPrompt, curriculumDocPath, templatePath, generationMode: requestedMode, locale: requestedLocale } = body;
  const locale = resolveLocale(requestedLocale);

  if (!subject || !grade || !duration) {
    return new Response(JSON.stringify({ error: 'subject, grade, and duration are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const generationMode = resolveGenerationMode(access.userPlan, requestedMode);

  let curriculumText: string | undefined;
  if (curriculumDocPath) {
    const { data: uploadRecord, error: uploadError } = await supabase
      .from('uploads')
      .select('parsed_content, type')
      .eq('storage_path', curriculumDocPath)
      .eq('user_id', user.id)
      .eq('type', 'curriculum_doc')
      .single();

    if (uploadError || !uploadRecord) {
      return new Response(JSON.stringify({ error: 'The selected curriculum document could not be found.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const parsedContent = uploadRecord.parsed_content as {
      text?: string;
      error?: string;
    } | null;

    if (parsedContent?.error) {
      return new Response(JSON.stringify({ error: parsedContent.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (parsedContent === null) {
      return new Response(
        JSON.stringify({ error: 'The curriculum document is still being processed. Please try again shortly.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    curriculumText = parsedContent?.text?.trim() || undefined;

    if (!curriculumText) {
      return new Response(
        JSON.stringify({
          error: 'The curriculum document could not be read. Please re-upload it and try again.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const useGemini = generationMode === 'fast';
      let modelUsed = useGemini ? GEMINI_FREE_MODEL : 'claude-sonnet-4-6';

      function send(event: GenerateStreamEvent) {
        controller.enqueue(encoder.encode(encodeSSE(event)));
      }

      try {
        send({ type: 'status', message: 'Starting generation…' });

        if (curriculumText) {
          send({ type: 'status', message: 'Analysing curriculum document…' });
        }

        send({ type: 'status', message: 'Writing lesson plan…' });

        const generated = await generateLessonContent({
          generationMode,
          subject,
          grade,
          curriculum: curriculum ?? '',
          duration,
          teacherPrompt: teacherPrompt ?? '',
          curriculumText,
          locale,
        });

        modelUsed = generated.modelUsed;
        const { lessonContent, inputTokens, outputTokens } = generated;

        send({ type: 'status', message: 'Structuring sections…' });

        for (const key of LESSON_SECTION_KEYS) {
          send({ type: 'section', key, data: lessonContent[key] });
        }

        const persistResult = await persistLessonPlan(supabase, {
          userId: user.id,
          title: lessonContent.title,
          subject,
          grade,
          curriculum: curriculum || null,
          durationMinutes: duration,
          content: lessonContent,
          modelUsed,
          tokenCount: inputTokens + outputTokens,
          templatePath: templatePath ?? null,
          generationCount: access.generationCount,
        });

        if (!persistResult.ok) {
          send({ type: 'error', message: persistResult.error });
          controller.close();
          return;
        }

        send({
          type: 'complete',
          lessonId: persistResult.lessonId,
          usage: { inputTokens, outputTokens },
        });
      } catch (err: unknown) {
        send({
          type: 'error',
          message: mapGenerationError(err, { isFreePlan: access.userPlan === 'free', modelUsed }),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
