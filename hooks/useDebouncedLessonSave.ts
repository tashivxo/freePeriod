'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { editTextToContent, stripHtml } from '@/lib/lesson/content';
import { debounce } from '@/lib/utils/debounce';
import type { LessonSection, LessonSectionKey } from '@/types';

const SAVE_DEBOUNCE_MS = 30_000;
const SAVED_STATUS_CLEAR_MS = 4_000;

export type LessonSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function pendingKeys(
  pending: Partial<Record<LessonSectionKey, string>>,
): LessonSectionKey[] {
  return (Object.keys(pending) as LessonSectionKey[]).filter(
    (key) => pending[key] !== undefined,
  );
}

export function useDebouncedLessonSave(
  lessonId: string,
  content: LessonSection,
  onSaved: (content: LessonSection, key: LessonSectionKey) => void,
) {
  const contentRef = useRef(content);
  const pendingRef = useRef<Partial<Record<LessonSectionKey, string>>>({});
  const persistChainRef = useRef(Promise.resolve(true));
  const mountedRef = useRef(true);
  const [status, setStatus] = useState<LessonSaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    if (status !== 'saved') return;
    const timer = window.setTimeout(() => setStatus('idle'), SAVED_STATUS_CLEAR_MS);
    return () => window.clearTimeout(timer);
  }, [status]);

  const persistPending = useCallback(async (): Promise<boolean> => {
    const pending = { ...pendingRef.current };
    const keys = pendingKeys(pending);
    if (keys.length === 0) return true;

    if (mountedRef.current) {
      setStatus('saving');
      setError(null);
    }

    let updatedContent = { ...contentRef.current };
    for (const key of keys) {
      const html = pending[key];
      if (html === undefined) continue;
      const stripped = stripHtml(html);
      const existingValue = updatedContent[key] ?? (key === 'vocabulary' ? [] : '');
      const value = editTextToContent(stripped, existingValue);
      updatedContent = { ...updatedContent, [key]: value };
    }

    const editedKeys = Array.from(
      new Set([...(updatedContent.editedKeys ?? []), ...keys]),
    );
    updatedContent = { ...updatedContent, editedKeys };

    const supabase = createClient();
    const { error: saveError } = await supabase
      .from('lesson_plans')
      .update({ content: updatedContent })
      .eq('id', lessonId);

    if (saveError) {
      if (mountedRef.current) {
        setStatus('error');
        setError('Failed to save changes');
      }
      return false;
    }

    for (const key of keys) {
      if (pendingRef.current[key] === pending[key]) {
        delete pendingRef.current[key];
      }
    }

    contentRef.current = updatedContent;
    if (mountedRef.current) {
      setIsDirty(pendingKeys(pendingRef.current).length > 0);
      for (const key of keys) {
        onSaved(updatedContent, key);
      }
      setStatus('saved');
    }
    return true;
  }, [lessonId, onSaved]);

  const persistPendingRef = useRef(persistPending);
  persistPendingRef.current = persistPending;

  const enqueuePersist = useCallback((): Promise<boolean> => {
    persistChainRef.current = persistChainRef.current.then(
      () => persistPendingRef.current(),
      () => persistPendingRef.current(),
    );
    return persistChainRef.current;
  }, []);

  const schedulePersist = useMemo(
    () =>
      debounce(() => {
        void enqueuePersist();
      }, SAVE_DEBOUNCE_MS),
    [enqueuePersist],
  );

  const schedulePersistRef = useRef(schedulePersist);
  schedulePersistRef.current = schedulePersist;

  useEffect(() => {
    return () => {
      schedulePersistRef.current.cancel();
      void persistPendingRef.current();
    };
  }, []);

  const save = useCallback(
    (key: LessonSectionKey, html: string) => {
      pendingRef.current[key] = html;
      setIsDirty(true);
      schedulePersist();
    },
    [schedulePersist],
  );

  const flush = useCallback(async (): Promise<boolean> => {
    schedulePersist.cancel();
    return enqueuePersist();
  }, [enqueuePersist, schedulePersist]);

  const cancel = useCallback(() => {
    schedulePersist.cancel();
    pendingRef.current = {};
    setIsDirty(false);
  }, [schedulePersist]);

  const revert = useCallback(
    async (
      key: LessonSectionKey,
      html: string,
      markEdited: boolean,
    ): Promise<boolean> => {
      schedulePersist.cancel();
      delete pendingRef.current[key];

      let updatedContent = { ...contentRef.current };
      const stripped = stripHtml(html);
      const existingValue = updatedContent[key] ?? (key === 'vocabulary' ? [] : '');
      const value = editTextToContent(stripped, existingValue);
      const editedKeys = new Set(updatedContent.editedKeys ?? []);
      if (markEdited) editedKeys.add(key);
      else editedKeys.delete(key);
      updatedContent = {
        ...updatedContent,
        [key]: value,
        editedKeys: Array.from(editedKeys),
      };

      if (mountedRef.current) {
        setStatus('saving');
        setError(null);
      }

      const supabase = createClient();
      const { error: saveError } = await supabase
        .from('lesson_plans')
        .update({ content: updatedContent })
        .eq('id', lessonId);

      if (saveError) {
        if (mountedRef.current) {
          setStatus('error');
          setError('Failed to save changes');
        }
        return false;
      }

      contentRef.current = updatedContent;
      if (mountedRef.current) {
        setIsDirty(pendingKeys(pendingRef.current).length > 0);
        onSaved(updatedContent, key);
        setStatus('saved');
      }
      return true;
    },
    [lessonId, onSaved, schedulePersist],
  );

  return { save, flush, cancel, revert, status, error, isDirty };
}
