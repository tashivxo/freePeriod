'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, remove } from 'animejs';
import { CheckCircle, Loader2 } from 'lucide-react';
import { HeroPictogram } from '@/components/animations/HeroPictogram';
import { Button } from '@/components/ui/Button';
import { getSectionProgressLabel, LESSON_SECTION_COUNT } from '@/lib/lesson/sections';
import type { GenerateStreamEvent, LessonSectionKey } from '@/types';

function getPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

type StatusStep = {
  message: string;
  done: boolean;
};

type GenerationScreenProps = {
  events: GenerateStreamEvent[];
  onComplete: (lessonId: string) => void;
  onCancel?: () => void;
  onRetry?: () => void;
  onBackToForm?: () => void;
};

export function GenerationScreen({
  events,
  onComplete,
  onCancel,
  onRetry,
  onBackToForm,
}: GenerationScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const hasCompletedRef = useRef(false);
  const [prefersReduced, setPrefersReduced] = useState(getPrefersReducedMotion);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Derive status steps from events
  const statusSteps: StatusStep[] = [];
  const receivedSections: LessonSectionKey[] = [];
  let errorMessage: string | null = null;

  for (const event of events) {
    if (event.type === 'status') {
      statusSteps.push({ message: event.message, done: true });
    } else if (event.type === 'section') {
      receivedSections.push(event.key);
    } else if (event.type === 'error') {
      errorMessage = event.message;
    }
  }

  // Mark last status as not done if no sections yet
  if (statusSteps.length > 0 && receivedSections.length === 0 && !errorMessage) {
    statusSteps[statusSteps.length - 1].done = false;
  }

  // Add section progress
  if (receivedSections.length > 0 && !errorMessage) {
    statusSteps.push({
      message: `Writing ${getSectionProgressLabel(receivedSections[receivedSections.length - 1])}…`,
      done: false,
    });
  }

  // Check for completion
  const completeEvent = events.find((e) => e.type === 'complete');
  if (completeEvent && completeEvent.type === 'complete' && !hasCompletedRef.current) {
    hasCompletedRef.current = true;
    setTimeout(() => onComplete(completeEvent.lessonId), 600);
  }

  // Entrance animation
  useEffect(() => {
    if (prefersReduced || !containerRef.current) return;

    animate(containerRef.current, {
      opacity: [0, 1],
      duration: 300,
      easing: 'easeOutQuad',
    });

    return () => {
      if (containerRef.current) remove(containerRef.current);
    };
  }, [prefersReduced]);

  // Animate new steps
  useEffect(() => {
    if (prefersReduced || !stepsRef.current) return;

    const lastChild = stepsRef.current.lastElementChild;
    if (lastChild) {
      animate(lastChild, {
        translateY: [8, 0],
        opacity: [0, 1],
        duration: 300,
        easing: 'easeOutQuad',
      });
    }
  }, [statusSteps.length, prefersReduced]);

  return (
    <div
      ref={containerRef}
      data-motion-enter
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
      style={{ opacity: prefersReduced ? 1 : 0 }}
      role="status"
      aria-live="polite"
      aria-label={errorMessage ? 'Generation failed' : 'Generating lesson plan'}
    >
      <HeroPictogram />

      <div ref={stepsRef} className="mt-10 max-w-sm space-y-3 text-center">
        {statusSteps.length === 0 && !errorMessage && (
          <div className="flex items-center justify-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="font-medium text-text-primary">Generating your lesson plan…</span>
          </div>
        )}

        {statusSteps.map((step, i) => (
          <div
            key={i}
            className="flex items-center justify-center gap-2 text-sm"
          >
            {step.done ? (
              <CheckCircle className="h-4 w-4 text-success" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            )}
            <span className={step.done ? 'text-text-secondary' : 'text-text-primary font-medium'}>
              {step.message}
            </span>
          </div>
        ))}

        {receivedSections.length > 0 && !completeEvent && !errorMessage && (
          <p className="text-xs text-text-secondary mt-4">
            {receivedSections.length} of {LESSON_SECTION_COUNT} sections ready
          </p>
        )}

        {completeEvent && (
          <p className="text-sm font-medium text-success mt-4">
            Lesson plan complete!
          </p>
        )}

        {errorMessage && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-error">{errorMessage}</p>
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
              {onRetry && (
                <Button type="button" onClick={onRetry}>
                  Try again
                </Button>
              )}
              {onBackToForm && (
                <Button type="button" variant="outline" onClick={onBackToForm}>
                  Back to form
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {!errorMessage && !completeEvent && onCancel && (
        <div className="mt-8">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel generation
          </Button>
        </div>
      )}
    </div>
  );
}
