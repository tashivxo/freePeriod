'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { editTextToContent, stripHtml } from '@/lib/lesson/content';
import { debounce } from '@/lib/utils/debounce';
import type { LessonSection, LessonSectionKey } from '@/types';

const SAVE_DEBOUNCE_MS = 30_000;
const SAVED_STATUS_CLEAR_MS = 4_000;

export type LessonSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useDebouncedLessonSave(
  lessonId: string,
  content: LessonSection,
  onSaved: (content: LessonSection, key: LessonSectionKey) => void,
) {
  const contentRef = useRef(content);
  const [status, setStatus] = useState<LessonSaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    if (status !== 'saved') return;
    const timer = window.setTimeout(() => setStatus('idle'), SAVED_STATUS_CLEAR_MS);
    return () => window.clearTimeout(timer);
  }, [status]);

  const saveSection = useCallback(async (key: LessonSectionKey, html: string) => {
    setStatus('saving');
    setError(null);
    const stripped = stripHtml(html);
    const existingValue = contentRef.current[key] ?? (key === 'vocabulary' ? [] : '');
    const value = editTextToContent(stripped, existingValue);
    const updatedContent = { ...contentRef.current, [key]: value };
    const supabase = createClient();

    const { error: saveError } = await supabase
      .from('lesson_plans')
      .update({ content: updatedContent as LessonSection })
      .eq('id', lessonId);

    if (saveError) {
      setStatus('error');
      setError('Failed to save changes');
      return;
    }

    contentRef.current = updatedContent as LessonSection;
    onSaved(updatedContent as LessonSection, key);
    setStatus('saved');
  }, [lessonId, onSaved]);

  const save = useMemo(
    () => debounce((key: LessonSectionKey, html: string) => {
      void saveSection(key, html);
    }, SAVE_DEBOUNCE_MS),
    [saveSection],
  );

  return { save, status, error };
}
