'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { animate, stagger, remove } from 'animejs';
import { ArrowLeft, Download, Clock, BookOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { SectionCard } from '@/components/lesson/SectionCard';
import { Button } from '@/components/ui/Button';
import type { LessonPlan, LessonSection } from '@/types/database';
import type { LessonSectionKey } from '@/types/lesson';

const SECTION_ORDER: { key: LessonSectionKey; label: string }[] = [
  { key: 'title', label: 'Title' },
  { key: 'objectives', label: 'Learning Objectives' },
  { key: 'successCriteria', label: 'Success Criteria' },
  { key: 'keyConcepts', label: 'Key Concepts' },
  { key: 'hook', label: 'Hook Activity' },
  { key: 'mainActivities', label: 'Main Activities' },
  { key: 'guidedPractice', label: 'Guided Practice' },
  { key: 'independentPractice', label: 'Independent Practice' },
  { key: 'formativeAssessment', label: 'Formative Assessment' },
  { key: 'differentiation', label: 'Differentiation' },
  { key: 'realWorldConnections', label: 'Real-World Connections' },
  { key: 'plenary', label: 'Plenary' },
];

type LessonViewProps = {
  lesson: LessonPlan;
};

export function LessonView({ lesson: initialLesson }: LessonViewProps) {
  const router = useRouter();
  const [lesson, setLesson] = useState(initialLesson);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [exportLoading, setExportLoading] = useState<'docx' | 'pdf' | null>(null);

  // Staggered reveal animation
  useEffect(() => {
    if (!cardsRef.current) return;

    const cards = Array.from(cardsRef.current.children);
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) return;

    // Hide before animating to prevent flash
    cards.forEach((el) => ((el as HTMLElement).style.opacity = '0'));

    animate(cards, {
      translateY: [16, 0],
      opacity: [0, 1],
      delay: stagger(60),
      duration: 400,
      easing: 'easeOutQuad',
    });

    return () => {
      cards.forEach((el) => remove(el));
    };
  }, []);

  const handleSave = useCallback(
    async (key: LessonSectionKey, value: unknown): Promise<boolean> => {
      const supabase = createClient();
      const updatedContent = { ...lesson.content, [key]: value };

      const { error } = await supabase
        .from('lesson_plans')
        .update({ content: updatedContent as LessonSection })
        .eq('id', lesson.id);

      if (error) return false;

      setLesson((prev) => ({
        ...prev,
        content: updatedContent as LessonSection,
      }));
      return true;
    },
    [lesson],
  );

  const handleExport = useCallback(
    async (format: 'docx' | 'pdf') => {
      setExportLoading(format);
      try {
        const response = await fetch('/api/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId: lesson.id, format }),
        });

        if (!response.ok) return;

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${lesson.title || 'lesson-plan'}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      } finally {
        setExportLoading(null);
      }
    },
    [lesson],
  );

  const content = lesson.content;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-1 text-sm font-body text-text-secondary hover:text-coral transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <h1 className="font-display text-3xl font-bold text-text-primary mb-2">
          {content.title || lesson.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm font-body text-text-secondary">
          <span className="inline-flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            {lesson.subject} · {lesson.grade}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {lesson.duration_minutes} min
          </span>
          {lesson.curriculum && (
            <span>{lesson.curriculum}</span>
          )}
        </div>

        {/* Export buttons */}
        <div className="mt-4 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleExport('docx')}
            isLoading={exportLoading === 'docx'}
          >
            <Download className="h-4 w-4 mr-1" />
            DOCX
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleExport('pdf')}
            isLoading={exportLoading === 'pdf'}
          >
            <Download className="h-4 w-4 mr-1" />
            PDF
          </Button>
        </div>
      </div>

      {/* Section cards */}
      <div ref={cardsRef} className="space-y-4">
        {SECTION_ORDER.filter((s) => s.key !== 'title').map((section) => (
          <div key={section.key} className="section-card-wrapper">
            <SectionCard
              sectionKey={section.key}
              label={section.label}
              content={content[section.key]}
              lessonId={lesson.id}
              onSave={handleSave}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
