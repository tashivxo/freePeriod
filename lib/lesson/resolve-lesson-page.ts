import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getMessages, type Locale } from '@/lib/i18n';
import { lessonDocumentTitleFromPlan } from '@/lib/lesson/page-title';
import type { LessonPlan } from '@/types';

export type ResolvedOwnedLessonPage =
  | { status: 200; lesson: LessonPlan; title: string }
  | { status: 404; title: string };

export const findOwnedLesson = cache(async (id: string): Promise<LessonPlan | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('lesson_plans')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  return data ?? null;
});

export async function resolveOwnedLessonPage(
  id: string,
  locale: Locale,
): Promise<ResolvedOwnedLessonPage> {
  const lesson = await findOwnedLesson(id);
  if (!lesson) {
    return {
      status: 404,
      title: getMessages(locale).status.notFoundDocumentTitle,
    };
  }

  return {
    status: 200,
    lesson,
    title: lessonDocumentTitleFromPlan(lesson),
  };
}
