'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { animate, remove } from 'animejs';
import { CheckCircle, Loader2 } from 'lucide-react';
import type { GenerateStreamEvent, LessonSectionKey } from '@/types/lesson';

const MugAnimation = dynamic(
  () => import('@/components/animations/MugAnimation').then((m) => m.MugAnimation),
  { ssr: false },
);

type StatusStep = {
  message: string;
  done: boolean;
};

type GenerationScreenProps = {
  events: GenerateStreamEvent[];
  onComplete: (lessonId: string) => void;
};

const SECTION_LABELS: Record<LessonSectionKey, string> = {
  title: 'Title',
  objectives: 'Learning objectives',
  successCriteria: 'Success criteria',
  keyConcepts: 'Key concepts',
  hook: 'Hook activity',
  mainActivities: 'Main activities',
  guidedPractice: 'Guided practice',
  independentPractice: 'Independent practice',
  formativeAssessment: 'Formative assessment',
  differentiation: 'Differentiation strategies',
  realWorldConnections: 'Real-world connections',
  plenary: 'Plenary',
};

export function GenerationScreen({ events, onComplete }: GenerationScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const hasCompletedRef = useRef(false);

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
  if (receivedSections.length > 0) {
    statusSteps.push({
      message: `Writing ${SECTION_LABELS[receivedSections[receivedSections.length - 1]]}…`,
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
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !containerRef.current) return;

    animate(containerRef.current, {
      opacity: [0, 1],
      duration: 300,
      easing: 'easeOutQuad',
    });

    return () => {
      if (containerRef.current) remove(containerRef.current);
    };
  }, []);

  // Animate new steps
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
  }, [statusSteps.length]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
      style={{ opacity: 0 }}
      role="status"
      aria-live="polite"
      aria-label="Generating lesson plan"
    >
      <MugAnimation />

      <div ref={stepsRef} className="mt-8 max-w-sm space-y-3 text-center">
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

        {receivedSections.length > 0 && !completeEvent && (
          <p className="text-xs text-text-secondary mt-4">
            {receivedSections.length} of 12 sections ready
          </p>
        )}

        {completeEvent && (
          <p className="text-sm font-medium text-success mt-4">
            Lesson plan complete!
          </p>
        )}

        {errorMessage && (
          <p className="text-sm text-error mt-4">{errorMessage}</p>
        )}
      </div>
    </div>
  );
}
