'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { editTextToContent, stripHtml } from '@/lib/lesson/content';
import { debounce } from '@/lib/utils/debounce';
import type { LessonSection, LessonSectionKey } from '@/types';

const SAVE_DEBOUNCE_MS = 30_000;

export function useDebouncedLessonSave(
  lessonId: string,
  content: LessonSection,
  onSaved: (content: LessonSection) => void,
) {
  const contentRef = useRef(content);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  const saveSection = useCallback(async (key: LessonSectionKey, html: string) => {
    const stripped = stripHtml(html);
    const existingValue = contentRef.current[key] ?? (key === 'vocabulary' ? [] : '');
    const value = editTextToContent(stripped, existingValue);
    const updatedContent = { ...contentRef.current, [key]: value };
    const supabase = createClient();

    const { error } = await supabase
      .from('lesson_plans')
      .update({ content: updatedContent as LessonSection })
      .eq('id', lessonId);

    if (!error) {
      contentRef.current = updatedContent as LessonSection;
      onSaved(updatedContent as LessonSection);
    }
  }, [lessonId, onSaved]);

  return useMemo(
    () => debounce((key: LessonSectionKey, html: string) => {
      void saveSection(key, html);
    }, SAVE_DEBOUNCE_MS),
    [saveSection],
  );
}
