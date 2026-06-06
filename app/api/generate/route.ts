import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveGenerationAccess } from '@/lib/generation/authorize';
import { generateLessonContent } from '@/lib/generation/generate-content';
import { mapGenerationError } from '@/lib/generation/map-error';
import { persistLessonPlan } from '@/lib/generation/persist';
import { encodeSSE } from '@/lib/generation/sse';
import { LESSON_SECTION_KEYS } from '@/lib/lesson/sections';
import type { GenerateRequest, GenerateStreamEvent } from '@/types';

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
    return new Response(
      JSON.stringify({
        error: 'Upgrade to Pro to generate more lesson plans.',
      }),
      { status: 402, headers: { 'Content-Type': 'application/json' } },
    );
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

  const { subject, grade, curriculum, duration, teacherPrompt, curriculumDocPath, templatePath, modelPreference } = body;

  if (!subject || !grade || !duration) {
    return new Response(JSON.stringify({ error: 'subject, grade, and duration are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const isFreePlan = access.userPlan === 'free';

  let curriculumText: string | undefined;
  if (curriculumDocPath) {
    const { data: uploadRecord } = await supabase
      .from('uploads')
      .select('parsed_content')
      .eq('storage_path', curriculumDocPath)
      .eq('user_id', user.id)
      .single();

    if (uploadRecord?.parsed_content) {
      curriculumText = (uploadRecord.parsed_content as { text?: string }).text ?? undefined;
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let modelUsed = isFreePlan ? 'gemini-2.5-flash' : 'claude-sonnet-4-6';

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
          isFreePlan,
          modelPreference,
          subject,
          grade,
          curriculum: curriculum ?? '',
          duration,
          teacherPrompt: teacherPrompt ?? '',
          curriculumText,
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
          message: mapGenerationError(err, { isFreePlan, modelUsed }),
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
