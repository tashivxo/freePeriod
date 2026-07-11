'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { animate, stagger, remove } from 'animejs';
import { ArrowLeft, Download, Clock, BookOpen } from 'lucide-react';
import { contentToString } from '@/lib/lesson/content';
import { LESSON_VIEW_SECTIONS } from '@/lib/lesson/sections';
import { downloadBlob } from '@/lib/download-blob';
import { buildExportFilename } from '@/lib/export/filename';
import { useDebouncedLessonSave } from '@/hooks/useDebouncedLessonSave';
import { SectionCard } from '@/features/lesson/components/SectionCard';
import { Button } from '@/components/ui/Button';
import type { LessonPlan } from '@/types';
import { BlurText } from '@/components/ui/BlurText';

type LessonViewProps = {
  lesson: LessonPlan;
};

export function LessonView({ lesson: initialLesson }: LessonViewProps) {
  const router = useRouter();
  const [lesson, setLesson] = useState(initialLesson);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [fillLoading, setFillLoading] = useState(false);

  const debouncedSave = useDebouncedLessonSave(lesson.id, lesson.content, (updatedContent) => {
    setLesson((prev) => ({ ...prev, content: updatedContent }));
  });

  useEffect(() => {
    if (!cardsRef.current) return;

    const cards = Array.from(cardsRef.current.children);
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) return;

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

  const handleExport = useCallback(async () => {
    setExportLoading(true);
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson.id, format: 'docx' }),
      });

      if (!response.ok) return;

      downloadBlob(await response.blob(), buildExportFilename(lesson.subject));
    } finally {
      setExportLoading(false);
    }
  }, [lesson.id, lesson.subject]);

  const handleFillTemplate = useCallback(async () => {
    setFillLoading(true);
    try {
      const response = await fetch('/api/export/fill-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson.id }),
      });

      if (!response.ok) return;

      const ext = lesson.template_path?.split('.').pop() ?? 'docx';
      downloadBlob(await response.blob(), `${lesson.title || 'lesson-plan'}-filled.${ext}`);
    } finally {
      setFillLoading(false);
    }
  }, [lesson.id, lesson.template_path, lesson.title]);

  const content = lesson.content;
  const templateExt = lesson.template_path?.split('.').pop()?.toLowerCase() ?? '';
  const canFillTemplate = templateExt === 'docx' || templateExt === 'xlsx' || templateExt === 'xls';

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-1 text-sm font-body text-text-secondary hover:text-coral transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <BlurText as="h1" text={content.title || lesson.title} className="font-display text-3xl font-bold text-text-primary mb-2" />

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

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void handleExport()}
            isLoading={exportLoading}
          >
            <Download className="h-4 w-4 mr-1" />
            Download DOCX
          </Button>
          {lesson.template_path && canFillTemplate && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleFillTemplate}
              isLoading={fillLoading}
            >
              <Download className="h-4 w-4 mr-1" />
              Download filled-in template
            </Button>
          )}
        </div>
      </div>

      <div ref={cardsRef} className="space-y-4">
        {LESSON_VIEW_SECTIONS.map((section) => (
          <div key={section.key} className="section-card">
            <SectionCard
              title={section.label}
              content={contentToString(content[section.key])}
              isEditing={editingKey === section.key}
              onEdit={() => setEditingKey(section.key)}
              onDone={() => setEditingKey(null)}
              onChange={(html) => debouncedSave(section.key, html)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
