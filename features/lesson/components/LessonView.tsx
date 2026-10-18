'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { animate, stagger, remove } from 'animejs';
import { ArrowLeft } from 'lucide-react';
import { BookTextIcon } from '@/components/ui/icons/book-text';
import { ClockIcon } from '@/components/ui/icons/clock';
import { DownloadIcon } from '@/components/ui/icons/download';
import { MotionSafeIcon } from '@/components/ui/icons/MotionSafeIcon';
import { XIcon } from '@/components/ui/icons/x';
import { contentToEditorHtml, contentToString, isRecord, stripHtml } from '@/lib/lesson/content';
import { LESSON_VIEW_SECTIONS } from '@/lib/lesson/sections';
import { isFillableTemplatePath } from '@/lib/lesson/template-path';
import { downloadBlob } from '@/lib/download-blob';
import { formatGradeLabel } from '@/lib/utils/grades';
import {
  isSafeExportErrorMessage,
  TEMPLATE_DOWNLOAD_FAILED_ERROR,
} from '@/lib/export/map-error';
import { buildExportFilename } from '@/lib/export/filename';
import { FREEPERIOD_TEMPLATE_DOWNLOAD_LABEL } from '@/lib/export/copy';
import { useDebouncedLessonSave } from '@/hooks/useDebouncedLessonSave';
import { useMotionSafeIconRef } from '@/hooks/useMotionSafeIconRef';
import { SectionCard } from '@/features/lesson/components/SectionCard';
import { SectionValueView } from '@/features/lesson/components/SectionValueView';
import {
  FilledTemplateChoiceDialog,
  type FilledTemplateDialogVariant,
} from '@/features/lesson/components/FilledTemplateChoiceDialog';
import { FILL_MY_TEMPLATE_LABEL } from '@/features/lesson/components/filled-template-copy';
import { Button } from '@/components/ui/Button';
import { FieldError } from '@/components/ui/FieldError';
import { CurriculumAccuracyNotice } from '@/components/curriculum/CurriculumAccuracyNotice';
import type { LessonPlan, LessonSectionKey } from '@/types';
import { BlurText } from '@/components/ui/effects/BlurText';
import { useZenMode } from '@/providers/zen-mode';
import { useLessonEditing } from '@/providers/lesson-editing';
import { useT } from '@/providers/locale';

type LessonViewProps = {
  lesson: LessonPlan;
};

const SAVED_NOTICE_MS = 4_000;
const SAVED_NOTICE_FADE_MS = 500;

async function readExportError(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { error?: unknown };
    return isSafeExportErrorMessage(data.error) ? data.error : fallback;
  } catch {
    return fallback;
  }
}

export function LessonView({ lesson: initialLesson }: LessonViewProps) {
  const router = useRouter();
  const { zenMode } = useZenMode();
  const { setEditing } = useLessonEditing();
  const t = useT();
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
  const [savedNoticeVisible, setSavedNoticeVisible] = useState(false);
  const [savedNoticeFading, setSavedNoticeFading] = useState(false);

  const filledTemplateVariant: FilledTemplateDialogVariant = isFillableTemplatePath(
    lesson.template_path,
  )
    ? 'has-template'
    : 'no-template';
  const fillHelperId = useId();
  const toolbarButtonClassName = 'h-auto min-h-11 w-full sm:h-7 sm:min-h-0 sm:w-auto';

  const {
    save: debouncedSave,
    flush,
    cancel,
    revert,
    status: saveStatus,
    error: saveError,
    isDirty,
  } = useDebouncedLessonSave(
    lesson.id,
    lesson.content,
    (updatedContent, key) => {
      setLesson((prev) => ({ ...prev, content: updatedContent }));
      setAutosaveFlashBySection((prev) => ({ ...prev, [key]: Date.now() }));
    },
  );
  const lessonRef = useRef(lesson);
  lessonRef.current = lesson;
  const editSnapshotRef = useRef<{
    key: LessonSectionKey;
    html: string;
    wasEdited: boolean;
  } | null>(null);

  useEffect(() => {
    setEditing(editingKey !== null);
    return () => setEditing(false);
  }, [editingKey, setEditing]);

  useEffect(() => {
    if (saveStatus !== 'saved') {
      setSavedNoticeVisible(false);
      setSavedNoticeFading(false);
      return;
    }
    setSavedNoticeVisible(true);
    setSavedNoticeFading(false);
    const fadeAt = Math.max(0, SAVED_NOTICE_MS - SAVED_NOTICE_FADE_MS);
    const fadeTimer = window.setTimeout(() => setSavedNoticeFading(true), fadeAt);
    const hideTimer = window.setTimeout(() => {
      setSavedNoticeVisible(false);
      setSavedNoticeFading(false);
    }, SAVED_NOTICE_MS);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [saveStatus]);

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

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  const leaveTo = useCallback(
    async (href: string) => {
      const ok = await flush();
      if (ok) {
        router.push(href);
        return;
      }
      const leave = window.confirm(t('lesson.leaveWithoutSaving'));
      if (!leave) return;
      cancel();
      router.push(href);
    },
    [cancel, flush, router, t],
  );

  const handleBack = useCallback(() => {
    void leaveTo('/dashboard');
  }, [leaveTo]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      void leaveTo(`${url.pathname}${url.search}`);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [leaveTo]);

  const handleExport = useCallback(async () => {
    setExportLoading(true);
    setExportError(null);
    try {
      const ok = await flush();
      if (!ok) return;

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
  }, [flush, lesson.id, lesson.subject]);

  const handleFillTemplate = useCallback(
    async (options?: { fromDialog?: boolean }): Promise<boolean> => {
      setFillLoading(true);
      if (!options?.fromDialog) {
        setExportError(null);
      }
      try {
        const ok = await flush();
        if (!ok) return false;

        const response = await fetch('/api/export/fill-template', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId: lesson.id }),
        });

        if (!response.ok) {
          const message = await readExportError(response, TEMPLATE_DOWNLOAD_FAILED_ERROR);
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
        const message = TEMPLATE_DOWNLOAD_FAILED_ERROR;
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
    [flush, lesson.id, lesson.template_path, lesson.title],
  );

  const handleFillTemplateFromDialog = useCallback(async () => {
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
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            void handleBack();
          }}
          className="min-h-11 inline-flex items-center gap-1 text-sm font-body text-text-secondary hover:text-coral transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <BlurText as="h1" text={content.title || lesson.title} className="font-display text-3xl font-bold text-text-primary mb-2" />

        <div className="flex flex-wrap items-center gap-4 text-sm font-body text-text-secondary">
          <span className="inline-flex items-center gap-1">
            <MotionSafeIcon icon={BookTextIcon} size={16} />
            {lesson.subject} · {formatGradeLabel(lesson.grade, t)}
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
          {savedNoticeVisible && (
            <span
              role="status"
              aria-live="polite"
              className={`text-emerald-700 dark:text-emerald-300 motion-safe:transition-opacity motion-safe:duration-500 ${
                savedNoticeFading ? 'opacity-0' : 'opacity-100'
              }`}
            >
              {t('lesson.savedToast')}
            </span>
          )}
          {saveStatus === 'error' && saveError && (
            <FieldError
              message={t('lesson.saveFailed')}
              className="mt-0 font-medium"
            />
          )}
        </div>

        <div className="mt-4">
          <CurriculumAccuracyNotice curriculum={lesson.curriculum} />
        </div>

        <div className="mt-4 flex flex-col gap-1.5">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
            <Button
              size="sm"
              className={toolbarButtonClassName}
              variant={filledTemplateVariant === 'has-template' ? 'default' : 'soft'}
              aria-describedby={
                filledTemplateVariant === 'has-template' ? fillHelperId : undefined
              }
              onClick={() => handleFilledTemplateDialogOpenChange(true)}
            >
              <MotionSafeIcon icon={DownloadIcon} size={16} className="mr-1" />
              {FILL_MY_TEMPLATE_LABEL}
            </Button>
            <Button
              size="sm"
              className={toolbarButtonClassName}
              variant={filledTemplateVariant === 'has-template' ? 'secondary' : 'accent'}
              onClick={() => void handleExport()}
              isLoading={exportLoading}
            >
              <MotionSafeIcon icon={DownloadIcon} size={16} className="mr-1" />
              {FREEPERIOD_TEMPLATE_DOWNLOAD_LABEL}
            </Button>
          </div>
          {filledTemplateVariant === 'has-template' ? (
            <p
              id={fillHelperId}
              className="text-left font-body text-xs text-text-secondary"
            >
              Uses your uploaded template
            </p>
          ) : null}
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
        onFillTemplate={handleFillTemplateFromDialog}
        onTemplateAttached={handleTemplateAttached}
        sharedTemplateLoading={fillLoading}
      />

      <div ref={cardsRef} className="space-y-4">
        {LESSON_VIEW_SECTIONS.map((section) => (
          <div key={section.key} className="section-card">
            <SectionCard
              title={section.label}
              content={contentToEditorHtml(content[section.key])}
              viewContent={
                isRecord(content[section.key]) ? (
                  <SectionValueView value={content[section.key]} />
                ) : undefined
              }
              isEditing={editingKey === section.key}
              isEdited={Boolean(content.editedKeys?.includes(section.key))}
              editedLabel={t('lesson.edited')}
              saveError={
                editingKey === section.key && saveStatus === 'error'
                  ? t('lesson.saveFailed')
                  : null
              }
              isSaving={editingKey === section.key && saveStatus === 'saving'}
              onEdit={() => {
                editSnapshotRef.current = {
                  key: section.key,
                  html: contentToString(content[section.key]),
                  wasEdited: Boolean(content.editedKeys?.includes(section.key)),
                };
                setEditingKey(section.key);
              }}
              onDone={async () => {
                const ok = await flush();
                if (ok) setEditingKey(null);
                return ok;
              }}
              onCancel={async (snapshotHtml) => {
                const snap = editSnapshotRef.current;
                cancel();
                if (
                  snap &&
                  stripHtml(contentToString(lessonRef.current.content[snap.key])) !==
                    stripHtml(snap.html)
                ) {
                  const ok = await revert(snap.key, snapshotHtml, snap.wasEdited);
                  if (!ok) return;
                }
                setEditingKey(null);
              }}
              onChange={(html) => debouncedSave(section.key, html)}
              onBlur={() => {
                void flush();
              }}
              autosaveFlashNonce={autosaveFlashBySection[section.key]}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
