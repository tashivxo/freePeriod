import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, LessonSection } from '@/types';
import { createAdminClient } from '@/lib/supabase/admin';
import { isValidDefaultTemplatePath } from '@/lib/lesson/default-template';

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
  let userDefaultTemplatePath: string | null = null;
  if (input.templatePath) {
    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('default_template_path')
      .eq('id', input.userId)
      .maybeSingle();
    if (userError) {
      console.error('[generate] Failed to load user default template path', {
        userId: input.userId,
        error: userError.message,
      });
      return { ok: false, error: 'Failed to save lesson plan' };
    }
    userDefaultTemplatePath = userRow?.default_template_path ?? null;
  }

  const targets: LinkTarget[] = [];
  if (input.curriculumDocPath) {
    targets.push({ path: input.curriculumDocPath, type: 'curriculum_doc' });
  }
  if (
    input.templatePath &&
    input.templatePath !== userDefaultTemplatePath
  ) {
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
  if (input.templatePath && !isValidDefaultTemplatePath(input.userId, input.templatePath)) {
    return { ok: false, error: 'Invalid template path' };
  }

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
      original_content: input.content,
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

  const admin = createAdminClient();
  await admin
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
