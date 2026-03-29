'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GenerateForm, type GenerateFormData } from './GenerateForm';
import { GenerationScreen } from '@/components/animations/GenerationScreen';
import type { GenerateStreamEvent } from '@/types/lesson';

type GenerateClientProps = {
  defaults?: {
    subject: string;
    grade: string;
    curriculum: string;
  };
};

export function GenerateClient({ defaults }: GenerateClientProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [events, setEvents] = useState<GenerateStreamEvent[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const handleSubmit = useCallback(async (data: GenerateFormData) => {
    setIsGenerating(true);
    setEvents([]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: 'Request failed' }));
        setEvents((prev) => [
          ...prev,
          { type: 'error', message: errorBody.error ?? 'Request failed' },
        ]);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setEvents((prev) => [...prev, { type: 'error', message: 'No response stream' }]);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const json = trimmed.slice(6);
          try {
            const event = JSON.parse(json) as GenerateStreamEvent;
            setEvents((prev) => [...prev, event]);
          } catch {
            // Skip malformed lines
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setEvents((prev) => [
        ...prev,
        { type: 'error', message: 'Connection lost. Please try again.' },
      ]);
    }
  }, []);

  const handleComplete = useCallback(
    (lessonId: string) => {
      router.push(`/lesson/${lessonId}`);
    },
    [router],
  );

  return (
    <>
      <GenerateForm defaults={defaults} onSubmit={handleSubmit} />
      {isGenerating && (
        <GenerationScreen events={events} onComplete={handleComplete} />
      )}
    </>
  );
}
