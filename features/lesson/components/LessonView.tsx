'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { animate, stagger, remove } from 'animejs';
import { ArrowLeft } from 'lucide-react';
import { BookTextIcon } from '@/components/ui/book-text';
import { ClockIcon } from '@/components/ui/clock';
import { DownloadIcon } from '@/components/ui/download';
import { MotionSafeIcon } from '@/components/icons/MotionSafeIcon';
import { contentToString } from '@/lib/lesson/content';
import { LESSON_VIEW_SECTIONS } from '@/lib/lesson/sections';
import { downloadBlob } from '@/lib/download-blob';
import { buildExportFilename } from '@/lib/export/filename';
import { useDebouncedLessonSave } from '@/hooks/useDebouncedLessonSave';
import { SectionCard } from '@/features/lesson/components/SectionCard';
import { Button } from '@/components/ui/Button';
import type { LessonPlan, LessonSectionKey } from '@/types';
import { BlurText } from '@/components/ui/BlurText';
import { useZenMode } from '@/providers/zen-mode';

type LessonViewProps = {
  lesson: LessonPlan;
};

async function readExportError(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? fallback;
  } catch {
    return fallback;
  }
}

export function LessonView({ lesson: initialLesson }: LessonViewProps) {
  const router = useRouter();
  const { zenMode } = useZenMode();
  const [lesson, setLesson] = useState(initialLesson);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [fillLoading, setFillLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [autosaveFlashBySection, setAutosaveFlashBySection] = useState<
    Partial<Record<LessonSectionKey, number>>
  >({});

  const { save: debouncedSave, status: saveStatus, error: saveError } = useDebouncedLessonSave(
    lesson.id,
    lesson.content,
    (updatedContent, key) => {
      setLesson((prev) => ({ ...prev, content: updatedContent }));
      setAutosaveFlashBySection((prev) => ({ ...prev, [key]: Date.now() }));
    },
  );

  useEffect(() => {
    if (!cardsRef.current) return;

    const cards = Array.from(cardsRef.current.children);
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || zenMode) return;

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
  }, [zenMode]);

  const handleExport = useCallback(async () => {
    setExportLoading(true);
    setExportError(null);
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson.id, format: 'docx' }),
      });

      if (!response.ok) {
        setExportError(await readExportError(response, 'Failed to export lesson'));
        return;
      }

      downloadBlob(await response.blob(), buildExportFilename(lesson.subject));
    } catch {
      setExportError('Failed to export lesson. Check your connection and try again.');
    } finally {
      setExportLoading(false);
    }
  }, [lesson.id, lesson.subject]);

  const handleFillTemplate = useCallback(async () => {
    setFillLoading(true);
    setExportError(null);
    try {
      const response = await fetch('/api/export/fill-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson.id }),
      });

      if (!response.ok) {
        setExportError(await readExportError(response, 'Failed to export filled template'));
        return;
      }

      const ext = lesson.template_path?.split('.').pop() ?? 'docx';
      downloadBlob(await response.blob(), `${lesson.title || 'lesson-plan'}-filled.${ext}`);
    } catch {
      setExportError('Failed to export filled template. Check your connection and try again.');
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
          className="min-h-11 inline-flex items-center gap-1 text-sm font-body text-text-secondary hover:text-coral transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <BlurText as="h1" text={content.title || lesson.title} className="font-display text-3xl font-bold text-text-primary mb-2" />

        <div className="flex flex-wrap items-center gap-4 text-sm font-body text-text-secondary">
          <span className="inline-flex items-center gap-1">
            <MotionSafeIcon icon={BookTextIcon} size={16} />
            {lesson.subject} · {lesson.grade}
          </span>
          <span className="inline-flex items-center gap-1">
            <MotionSafeIcon icon={ClockIcon} size={16} />
            {lesson.duration_minutes} min
          </span>
          {lesson.curriculum && (
            <span>{lesson.curriculum}</span>
          )}
          {saveStatus === 'saving' && (
            <span role="status" className="text-text-secondary">
              Saving…
            </span>
          )}
          {saveStatus === 'saved' && (
            <span role="status" className="text-success">
              Saved
            </span>
          )}
          {saveStatus === 'error' && saveError && (
            <span role="status" className="text-error">
              {saveError}
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void handleExport()}
            isLoading={exportLoading}
          >
            <MotionSafeIcon icon={DownloadIcon} size={16} className="mr-1" />
            Download DOCX
          </Button>
          {lesson.template_path && canFillTemplate && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleFillTemplate}
              isLoading={fillLoading}
            >
              <MotionSafeIcon icon={DownloadIcon} size={16} className="mr-1" />
              Download filled-in template
            </Button>
          )}
        </div>
        {exportError ? (
          <p role="alert" className="mt-3 text-sm font-medium text-error">
            {exportError}
          </p>
        ) : null}
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
              autosaveFlashNonce={autosaveFlashBySection[section.key]}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
