'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createLessonShare, type LessonShareResult } from '@/lib/share/create-lesson-share';
import { useT } from '@/providers/locale';

type UseCreateLessonShareOptions = {
  open: boolean;
  lessonId: string;
  onOpenChange: (open: boolean) => void;
  onBeforeShare?: () => Promise<boolean>;
};

export function useCreateLessonShare({
  open,
  lessonId,
  onOpenChange,
  onBeforeShare,
}: UseCreateLessonShareOptions) {
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [share, setShare] = useState<LessonShareResult | null>(null);
  const shareRequestRef = useRef(0);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setShare(null);
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }

    const requestId = ++shareRequestRef.current;
    let cancelled = false;

    async function runShare() {
      setLoading(true);
      setError(null);
      setShare(null);

      if (onBeforeShare) {
        const ok = await onBeforeShare();
        if (!ok) {
          if (cancelled || requestId !== shareRequestRef.current) return;
          setLoading(false);
          onOpenChange(false);
          return;
        }
      }

      try {
        const body = await createLessonShare(lessonId);
        if (cancelled || requestId !== shareRequestRef.current) return;
        setShare(body);
      } catch {
        if (cancelled || requestId !== shareRequestRef.current) return;
        setError(t('share.error'));
      } finally {
        if (!cancelled && requestId === shareRequestRef.current) {
          setLoading(false);
        }
      }
    }

    void runShare();

    return () => {
      cancelled = true;
    };
  }, [lessonId, onBeforeShare, onOpenChange, open, reset, t]);

  return { loading, error, share, reset };
}