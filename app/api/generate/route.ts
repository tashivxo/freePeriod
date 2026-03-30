import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { buildSystemPrompt, buildUserPrompt, parseLessonContent } from '@/lib/claude/prompts';
import type { GenerateRequest, GenerateStreamEvent } from '@/types/lesson';
import type { LessonSection } from '@/types/database';

const ALLOWED_MODELS = ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5'] as const;
type AllowedModel = (typeof ALLOWED_MODELS)[number];

function isAllowedModel(model: string): model is AllowedModel {
  return (ALLOWED_MODELS as readonly string[]).includes(model);
}

function encodeSSE(event: GenerateStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
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

  const model = modelPreference && isAllowedModel(modelPreference) ? modelPreference : 'claude-opus-4-6';

  // Fetch parsed curriculum doc text if provided
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

  const systemPrompt = buildSystemPrompt(curriculumText);
  const userPrompt = buildUserPrompt({ subject, grade, curriculum, duration, teacherPrompt });

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      function send(event: GenerateStreamEvent) {
        controller.enqueue(encoder.encode(encodeSSE(event)));
      }

      try {
        send({ type: 'status', message: 'Starting generation…' });

        if (curriculumText) {
          send({ type: 'status', message: 'Analysing curriculum document…' });
        }

        send({ type: 'status', message: 'Writing lesson plan…' });

        const messageStream = anthropic.messages.stream({
          model,
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

        send({ type: 'status', message: 'Structuring sections…' });

        const lessonContent = parseLessonContent(fullText);

        if (!lessonContent) {
          send({ type: 'error', message: 'Failed to parse lesson plan from Claude response' });
          controller.close();
          return;
        }

        // Send each section as a stream event
        const sectionKeys = [
          'title', 'objectives', 'successCriteria', 'keyConcepts',
          'hook', 'mainActivities', 'guidedPractice', 'independentPractice',
          'formativeAssessment', 'differentiation', 'realWorldConnections', 'plenary',
        ] as const;

        for (const key of sectionKeys) {
          send({ type: 'section', key, data: lessonContent[key] });
        }

        // Calculate token usage
        const inputTokens = finalMessage.usage.input_tokens;
        const outputTokens = finalMessage.usage.output_tokens;
        const totalTokens = inputTokens + outputTokens;

        // Save lesson plan to database
        const { data: lessonPlan, error: insertError } = await supabase
          .from('lesson_plans')
          .insert({
            user_id: user.id,
            title: lessonContent.title,
            subject,
            grade,
            curriculum: curriculum || null,
            duration_minutes: duration,
            content: lessonContent as LessonSection,
            model_used: model,
            token_count: totalTokens,
            template_path: templatePath || null,
          })
          .select('id')
          .single();

        if (insertError || !lessonPlan) {
          send({ type: 'error', message: 'Failed to save lesson plan' });
          controller.close();
          return;
        }

        // Increment user generation count
        const { data: userData } = await supabase
          .from('users')
          .select('generation_count')
          .eq('id', user.id)
          .single();

        if (userData) {
          await supabase
            .from('users')
            .update({ generation_count: userData.generation_count + 1 })
            .eq('id', user.id);
        }

        send({
          type: 'complete',
          lessonId: lessonPlan.id,
          usage: { inputTokens, outputTokens },
        });
      } catch (err: unknown) {
        // Anthropic SDK wraps errors as: { status, error: { type: 'error', error: { type, message } } }
        const sdkErr = err as {
          status?: number;
          error?: { type?: string; error?: { type?: string; message?: string } };
          message?: string;
        };
        const errType = sdkErr.error?.error?.type ?? sdkErr.error?.type;
        const errMessage = sdkErr.error?.error?.message ?? sdkErr.message ?? '';

        if (errType === 'overloaded_error') {
          send({ type: 'error', message: 'Claude is currently overloaded. Please try again in a moment.' });
        } else if (sdkErr.status === 429) {
          send({ type: 'error', message: 'Rate limit reached. Please wait a moment and try again.' });
        } else if (errMessage.toLowerCase().includes('credit balance') || errMessage.toLowerCase().includes('insufficient')) {
          send({ type: 'error', message: 'Anthropic API credits are exhausted. Please add credits at console.anthropic.com.' });
        } else if (errType === 'invalid_request_error') {
          send({ type: 'error', message: 'Invalid request to Claude API. Please try again.' });
        } else {
          console.error('[generate] Unexpected Claude error:', JSON.stringify(err));
          send({ type: 'error', message: 'An unexpected error occurred during generation.' });
        }
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
