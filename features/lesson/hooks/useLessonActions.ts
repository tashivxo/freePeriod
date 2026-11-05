'use client';

import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { createClient } from '@/lib/supabase/client';

type LessonRow = { id: string; title: string };

type Options = {
  /** Runs after a successful delete, e.g. to refresh filter options. */
  afterDelete?: () => void | Promise<void>;
};

/** Shared rename and delete handlers for lists of lesson cards. */
export function useLessonActions<T extends LessonRow>(
  setLessons: Dispatch<SetStateAction<T[]>>,
  { afterDelete }: Options = {},
) {
  const handleDelete = useCallback(
    async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from('lesson_plans').delete().eq('id', id);
      if (error) throw error;
      setLessons((prev) => prev.filter((lesson) => lesson.id !== id));
      await afterDelete?.();
    },
    [afterDelete, setLessons],
  );

  const handleRename = useCallback(
    async (id: string, title: string) => {
      let previousTitle: string | undefined;
      setLessons((prev) =>
        prev.map((lesson) => {
          if (lesson.id !== id) return lesson;
          previousTitle = lesson.title;
          return { ...lesson, title };
        }),
      );

      const supabase = createClient();
      const { error } = await supabase.from('lesson_plans').update({ title }).eq('id', id);
      if (error) {
        setLessons((prev) =>
          prev.map((lesson) =>
            lesson.id === id && previousTitle !== undefined
              ? { ...lesson, title: previousTitle }
              : lesson,
          ),
        );
        throw error;
      }
    },
    [setLessons],
  );

  return { handleDelete, handleRename };
}
