import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, LessonSection } from '@/types';

export type PersistLessonInput = {
  userId: string;
  title: string;
  subject: string;
  grade: string;
  curriculum: string | null;
  durationMinutes: number;
  content: LessonSection;
  modelUsed: string;
  tokenCount: number;
  curriculumDocPath: string | null;
  templatePath: string | null;
  generationCount: number;
};

export type PersistLessonResult =
  | { ok: true; lessonId: string }
  | { ok: false; error: string };

type LinkTarget = {
  path: string;
  type: 'curriculum_doc' | 'template';
};

export async function linkUploadsToLesson(
  supabase: SupabaseClient<Database>,
  input: {
    userId: string;
    lessonId: string;
    curriculumDocPath: string | null;
    templatePath: string | null;
  },
): Promise<PersistLessonResult> {
  const targets: LinkTarget[] = [];
  if (input.curriculumDocPath) {
    targets.push({ path: input.curriculumDocPath, type: 'curriculum_doc' });
  }
  if (input.templatePath) {
    targets.push({ path: input.templatePath, type: 'template' });
  }

  for (const target of targets) {
    const { data, error } = await supabase
      .from('uploads')
      .update({ lesson_id: input.lessonId })
      .eq('storage_path', target.path)
      .eq('user_id', input.userId)
      .eq('type', target.type)
      .select('id')
      .maybeSingle();

    if (error || !data) {
      console.error('[generate] Failed to link upload to lesson', {
        userId: input.userId,
        lessonId: input.lessonId,
        storagePath: target.path,
        type: target.type,
        error: error
          ? {
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint,
            }
          : null,
      });
      return {
        ok: false,
        error:
          'The lesson was saved, but an uploaded file could not be linked to it. Open History to find the lesson, or try again.',
      };
    }
  }

  return { ok: true, lessonId: input.lessonId };
}

export async function persistLessonPlan(
  supabase: SupabaseClient<Database>,
  input: PersistLessonInput,
): Promise<PersistLessonResult> {
  const { data: lessonPlan, error: insertError } = await supabase
    .from('lesson_plans')
    .insert({
      user_id: input.userId,
      title: input.title,
      subject: input.subject,
      grade: input.grade,
      curriculum: input.curriculum,
      duration_minutes: input.durationMinutes,
      content: input.content,
      model_used: input.modelUsed,
      token_count: input.tokenCount,
      template_path: input.templatePath,
    })
    .select('id')
    .single();

  if (insertError || !lessonPlan) {
    console.error('[generate] Failed to save lesson plan', {
      userId: input.userId,
      modelUsed: input.modelUsed,
      insertError: insertError
        ? {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
          }
        : null,
      lessonPlanReturned: Boolean(lessonPlan),
    });
    return { ok: false, error: 'Failed to save lesson plan' };
  }

  await supabase
    .from('users')
    .update({ generation_count: input.generationCount + 1 })
    .eq('id', input.userId);

  const linkResult = await linkUploadsToLesson(supabase, {
    userId: input.userId,
    lessonId: lessonPlan.id,
    curriculumDocPath: input.curriculumDocPath,
    templatePath: input.templatePath,
  });
  if (!linkResult.ok) {
    return linkResult;
  }

  return { ok: true, lessonId: lessonPlan.id };
}
