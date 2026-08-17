'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { animate, stagger, remove } from 'animejs';
import { ArrowLeft } from 'lucide-react';
import { BookTextIcon } from '@/components/ui/icons/book-text';
import { ClockIcon } from '@/components/ui/icons/clock';
import { DownloadIcon } from '@/components/ui/icons/download';
import { MotionSafeIcon } from '@/components/ui/icons/MotionSafeIcon';
import { XIcon } from '@/components/ui/icons/x';
import { contentToString } from '@/lib/lesson/content';
import { LESSON_VIEW_SECTIONS } from '@/lib/lesson/sections';
import { isFillableTemplatePath, isPdfTemplatePath } from '@/lib/lesson/template-path';
import { downloadBlob } from '@/lib/download-blob';
import { formatGradeLabel } from '@/lib/utils/grades';
import { buildExportFilename } from '@/lib/export/filename';
import { useDebouncedLessonSave } from '@/hooks/useDebouncedLessonSave';
import { useMotionSafeIconRef } from '@/hooks/useMotionSafeIconRef';
import { SectionCard } from '@/features/lesson/components/SectionCard';
import {
  FilledTemplateChoiceDialog,
  type FilledTemplateDialogVariant,
} from '@/features/lesson/components/FilledTemplateChoiceDialog';
import { Button } from '@/components/ui/Button';
import { CurriculumAccuracyNotice } from '@/components/curriculum/CurriculumAccuracyNotice';
import type { LessonPlan, LessonSectionKey } from '@/types';
import { BlurText } from '@/components/ui/effects/BlurText';
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
  const { ref: exportErrorIconRef, animationDisabled: exportErrorIconMotionDisabled } =
    useMotionSafeIconRef();
  const [filledTemplateDialogOpen, setFilledTemplateDialogOpen] = useState(false);
  const [dialogActionError, setDialogActionError] = useState<string | null>(null);
  const [autosaveFlashBySection, setAutosaveFlashBySection] = useState<
    Partial<Record<LessonSectionKey, number>>
  >({});

  const hasFillableTemplate = isFillableTemplatePath(lesson.template_path);
  const filledTemplateVariant: FilledTemplateDialogVariant = hasFillableTemplate
    ? 'has-template'
    : 'no-template';
  const showPdfNote = Boolean(lesson.template_path && isPdfTemplatePath(lesson.template_path));

  const { save: debouncedSave, status: saveStatus, error: saveError } = useDebouncedLessonSave(
    lesson.id,
    lesson.content,
    (updatedContent, key) => {
      setLesson((prev) => ({ ...prev, content: updatedContent }));
      setAutosaveFlashBySection((prev) => ({ ...prev, [key]: Date.now() }));
    },
  );

  useEffect(() => {
    if (!exportError || exportErrorIconMotionDisabled) return;
    exportErrorIconRef.current?.startAnimation();
  }, [exportError, exportErrorIconMotionDisabled, exportErrorIconRef]);

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

  const handleExport = useCallback(
    async (options?: { fromDialog?: boolean }): Promise<boolean> => {
      setExportLoading(true);
      if (!options?.fromDialog) {
        setExportError(null);
      }
      try {
        const response = await fetch('/api/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId: lesson.id, format: 'docx' }),
        });

        if (!response.ok) {
          const message = await readExportError(response, 'Failed to export lesson');
          if (options?.fromDialog) {
            setDialogActionError(message);
          } else {
            setExportError(message);
          }
          return false;
        }

        downloadBlob(await response.blob(), buildExportFilename(lesson.subject));
        return true;
      } catch {
        const message = 'Failed to export lesson. Check your connection and try again.';
        if (options?.fromDialog) {
          setDialogActionError(message);
        } else {
          setExportError(message);
        }
        return false;
      } finally {
        setExportLoading(false);
      }
    },
    [lesson.id, lesson.subject],
  );

  const handleFillTemplate = useCallback(
    async (options?: { fromDialog?: boolean }): Promise<boolean> => {
      setFillLoading(true);
      if (!options?.fromDialog) {
        setExportError(null);
      }
      try {
        const response = await fetch('/api/export/fill-template', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId: lesson.id }),
        });

        if (!response.ok) {
          const message = await readExportError(response, 'Failed to export filled template');
          if (options?.fromDialog) {
            setDialogActionError(message);
          } else {
            setExportError(message);
          }
          return false;
        }

        const ext = lesson.template_path?.split('.').pop() ?? 'docx';
        downloadBlob(await response.blob(), `${lesson.title || 'lesson-plan'}-filled.${ext}`);
        return true;
      } catch {
        const message =
          'Failed to export filled template. Check your connection and try again.';
        if (options?.fromDialog) {
          setDialogActionError(message);
        } else {
          setExportError(message);
        }
        return false;
      } finally {
        setFillLoading(false);
      }
    },
    [lesson.id, lesson.template_path, lesson.title],
  );

  const handleFreePeriodFromDialog = useCallback(async () => {
    setDialogActionError(null);
    const ok = await handleExport({ fromDialog: true });
    if (ok) {
      setFilledTemplateDialogOpen(false);
    }
  }, [handleExport]);

  const handleSharedTemplateFromDialog = useCallback(async () => {
    setDialogActionError(null);
    const ok = await handleFillTemplate({ fromDialog: true });
    if (ok) {
      setFilledTemplateDialogOpen(false);
    }
  }, [handleFillTemplate]);

  const handleFilledTemplateDialogOpenChange = useCallback((open: boolean) => {
    setFilledTemplateDialogOpen(open);
    if (open) {
      setDialogActionError(null);
    }
  }, []);

  const handleTemplateAttached = useCallback((templatePath: string) => {
    setLesson((prev) => ({ ...prev, template_path: templatePath }));
  }, []);

  const content = lesson.content;

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
            {lesson.subject} · {formatGradeLabel(lesson.grade)}
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

        <div className="mt-4">
          <CurriculumAccuracyNotice curriculum={lesson.curriculum} />
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
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleFilledTemplateDialogOpenChange(true)}
          >
            <MotionSafeIcon icon={DownloadIcon} size={16} className="mr-1" />
            Download filled template
          </Button>
        </div>
        {exportError ? (
          <div role="alert" className="mt-3 flex gap-3 rounded-xl bg-error/10 p-3 text-error">
            <XIcon
              ref={exportErrorIconRef}
              size={24}
              animationDisabled={exportErrorIconMotionDisabled}
              aria-hidden
              className="mt-0.5 shrink-0"
            />
            <p className="font-body text-sm text-error">{exportError}</p>
          </div>
        ) : null}
      </div>

      <FilledTemplateChoiceDialog
        open={filledTemplateDialogOpen}
        onOpenChange={handleFilledTemplateDialogOpenChange}
        dialogActionError={dialogActionError}
        lessonId={lesson.id}
        variant={filledTemplateVariant}
        showPdfNote={showPdfNote}
        onFreePeriodDownload={handleFreePeriodFromDialog}
        onUseSharedTemplate={handleSharedTemplateFromDialog}
        onTemplateAttached={handleTemplateAttached}
        freePeriodLoading={exportLoading}
        sharedTemplateLoading={fillLoading}
      />

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
