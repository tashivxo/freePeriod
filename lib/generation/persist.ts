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
  templatePath: string | null;
  generationCount: number;
};

export type PersistLessonResult =
  | { ok: true; lessonId: string }
  | { ok: false; error: string };

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

  return { ok: true, lessonId: lessonPlan.id };
}
