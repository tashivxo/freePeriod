'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GenerateForm, type GenerateFormData } from './GenerateForm';
import { GenerationScreen } from '@/components/animations/GenerationScreen';
import { UpgradePrompt } from '@/components/ui/UpgradePrompt';
import { drainSseEvents } from '@/lib/generation/sse';
import { useLocale } from '@/providers/locale';
import type { GenerateStreamEvent, Plan } from '@/types';
import type { Locale } from '@/lib/i18n';

type GenerationPhase = 'idle' | 'generating' | 'error';

type GenerateClientProps = {
  defaults?: {
    subject: string;
    grade: string;
    curriculum: string;
  };
  plan?: Plan;
  preferredLocale?: Locale;
};

export function GenerateClient({
  defaults,
  plan = 'free',
  preferredLocale,
}: GenerateClientProps) {
  const router = useRouter();
  const { locale, setLocale } = useLocale();
  const generationLocale = locale ?? 'en';
  const [phase, setPhase] = useState<GenerationPhase>('idle');
  const [events, setEvents] = useState<GenerateStreamEvent[]>([]);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const lastFormDataRef = useRef<GenerateFormData | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isGenerating = phase === 'generating';
  const showOverlay = phase === 'generating' || phase === 'error';

  useEffect(() => {
    if (preferredLocale && preferredLocale !== locale) {
      setLocale(preferredLocale);
    }
  }, [locale, preferredLocale, setLocale]);

  const returnToForm = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase('idle');
    setEvents([]);
  }, []);

  const handleSubmit = useCallback(async (data: GenerateFormData) => {
    lastFormDataRef.current = data;
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    setPhase('generating');
    setEvents([]);

    const surfaceError = (message: string) => {
      setEvents((prev) => [...prev, { type: 'error', message }]);
      setPhase('error');
      abortRef.current = null;
    };

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, locale: generationLocale }),
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 402 && plan === 'free') {
          setShowUpgrade(true);
          setPhase('idle');
          setEvents([]);
          abortRef.current = null;
          return;
        }
        const errorBody = await response.json().catch(() => ({ error: 'Request failed' }));
        surfaceError(errorBody.error ?? 'Request failed');
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        surfaceError('No response stream');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let terminalError = false;
      let sawComplete = false;

      const applyEvents = (incoming: GenerateStreamEvent[]) => {
        if (incoming.length === 0) return;
        setEvents((prev) => [...prev, ...incoming]);
        for (const event of incoming) {
          if (event.type === 'error') {
            terminalError = true;
            setPhase('error');
            abortRef.current = null;
          }
          if (event.type === 'complete') {
            sawComplete = true;
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          buffer += decoder.decode();
          const flushed = drainSseEvents(buffer, true);
          applyEvents(flushed.events);
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const drained = drainSseEvents(buffer);
        buffer = drained.rest;
        applyEvents(drained.events);

        if (terminalError) break;
      }

      if (!terminalError && !sawComplete && abortRef.current === controller) {
        surfaceError(
          'Generation stopped before the lesson was saved. Please try again.',
        );
        return;
      }

      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      surfaceError('Connection lost. Please try again.');
    }
  }, [generationLocale, plan]);

  const handleRetry = useCallback(() => {
    const data = lastFormDataRef.current;
    if (data) {
      void handleSubmit(data);
    } else {
      returnToForm();
    }
  }, [handleSubmit, returnToForm]);

  const handleComplete = useCallback(
    (lessonId: string) => {
      router.push(`/lesson/${lessonId}`);
    },
    [router],
  );

  return (
    <>
      <GenerateForm
        defaults={defaults}
        userPlan={plan}
        onSubmit={handleSubmit}
        isGenerating={isGenerating}
      />
      {showOverlay && (
        <GenerationScreen
          events={events}
          onComplete={handleComplete}
          onCancel={returnToForm}
          onRetry={handleRetry}
          onBackToForm={returnToForm}
        />
      )}
      {plan === 'free' && (
        <UpgradePrompt open={showUpgrade} onDismiss={() => setShowUpgrade(false)} />
      )}
    </>
  );
}
