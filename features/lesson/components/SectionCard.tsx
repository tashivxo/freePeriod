'use client';

import { useId, useState, useRef, useEffect, useCallback, type KeyboardEvent, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { animate } from 'animejs';
import { ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { SUCCESS } from '@/lib/utils/brand-colors';
import { Button } from '@/components/ui/Button';
import { stripHtml } from '@/lib/lesson/content';
import { useT } from '@/providers/locale';

// Tiptap uses browser-only APIs — load it client-side only
const LessonEditor = dynamic(
  () => import('./LessonEditor').then((m) => ({ default: m.LessonEditor })),
  { ssr: false },
);

type SectionCardProps = {
  title: string;
  content: string;
  viewContent?: ReactNode;
  isEditing: boolean;
  isEdited?: boolean;
  editedLabel?: string;
  saveError?: string | null;
  isSaving?: boolean;
  onEdit: () => void;
  onDone: () => void | boolean | Promise<boolean>;
  onCancel?: (snapshot: string) => void;
  onChange: (html: string) => void;
  onBlur?: () => void;
  autosaveFlashNonce?: number;
};

export function SectionCard({
  title,
  content,
  viewContent,
  isEditing,
  isEdited = false,
  editedLabel = 'Edited',
  saveError = null,
  isSaving = false,
  onEdit,
  onDone,
  onCancel,
  onChange,
  onBlur,
  autosaveFlashNonce,
}: SectionCardProps) {
  const t = useT();
  const errorId = useId();
  const [isOpen, setIsOpen] = useState(true);
  const [draft, setDraft] = useState(content);
  const [localError, setLocalError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const snapshotRef = useRef(content);
  const wasEditingRef = useRef(isEditing);

  const flashSaved = useCallback(() => {
    if (!cardRef.current) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const successColor =
      getComputedStyle(document.documentElement).getPropertyValue('--color-success').trim() ||
      SUCCESS;
    const endColor = getComputedStyle(cardRef.current).borderColor;
    animate(cardRef.current, {
      borderColor: [successColor, endColor],
      duration: 800,
      easing: 'easeOutQuad',
    });
  }, []);

  useEffect(() => {
    if (autosaveFlashNonce == null) return;
    flashSaved();
  }, [autosaveFlashNonce, flashSaved]);

  useEffect(() => {
    if (!isEditing) return;
    snapshotRef.current = content;
    setDraft(content);
    setLocalError(null);
    // Snapshot only when entering edit mode, not when blur persists new content.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- content is intentionally excluded
  }, [isEditing]);

  useEffect(() => {
    if (wasEditingRef.current && !isEditing) {
      editButtonRef.current?.focus();
    }
    wasEditingRef.current = isEditing;
  }, [isEditing]);

  const hasChanges = stripHtml(draft) !== stripHtml(snapshotRef.current);
  const errorMessage = saveError || localError;

  const handleChange = (html: string) => {
    setDraft(html);
    onChange(html);
  };

  const handleSave = async () => {
    setLocalError(null);
    const result = await Promise.resolve(onDone());
    if (result === false) {
      setLocalError(t('lesson.saveFailed'));
      return;
    }
    flashSaved();
  };

  const handleCancel = () => {
    if (hasChanges && !window.confirm(t('lesson.discardEdits'))) return;
    onCancel?.(snapshotRef.current);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isEditing) return;
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      void handleSave();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      handleCancel();
    }
  };

  const panelOpen = isOpen || isEditing;

  return (
    <div
      ref={cardRef}
      className="rounded-xl border-2 border-text-secondary/20 bg-surface overflow-hidden transition-colors"
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="flex w-full items-center justify-between px-5 py-4">
        <button
          type="button"
          onClick={() => {
            if (isEditing) return;
            setIsOpen(!isOpen);
          }}
          disabled={isEditing}
          className="flex flex-1 items-center gap-2 text-left hover:opacity-80 transition-opacity disabled:cursor-default disabled:hover:opacity-100"
          aria-expanded={panelOpen}
        >
          <h3 className="font-display text-lg font-semibold text-text-primary">{title}</h3>
          {isEdited && editedLabel ? (
            <span className="rounded-full bg-primary-soft px-2 py-0.5 font-body text-xs font-medium text-foreground">
              {editedLabel}
            </span>
          ) : null}
          <div
            className="t-icon-swap h-5 w-5 shrink-0 text-text-secondary"
            data-state={isOpen ? 'b' : 'a'}
            aria-hidden="true"
          >
            <span className="t-icon" data-icon="a">
              <ChevronDown className="h-5 w-5" />
            </span>
            <span className="t-icon" data-icon="b">
              <ChevronUp className="h-5 w-5" />
            </span>
          </div>
        </button>

        {!isEditing ? (
          <button
            ref={editButtonRef}
            type="button"
            onClick={() => {
              setIsOpen(true);
              onEdit();
            }}
            aria-label={`Edit ${title}`}
            className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-md text-text-secondary hover:text-coral transition-colors"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {/* Content — stay open while editing so the editor cannot collapse mid-edit */}
      <div
        className="t-panel-collapse grid overflow-hidden"
        style={{
          gridTemplateRows: panelOpen ? '1fr' : '0fr',
          transitionDuration: panelOpen ? 'var(--panel-open-dur)' : 'var(--panel-close-dur)',
        }}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className="t-panel-slide px-5 pb-4 border-t border-text-secondary/10"
            data-open={panelOpen ? 'true' : 'false'}
            aria-hidden={!panelOpen}
          >
            {isEditing ? (
              <div className="mt-3">
                <LessonEditor content={content} onChange={handleChange} onBlur={onBlur} />
                <div className="mt-3 flex w-full justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-11 flex-1 sm:flex-none"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    {t('lesson.cancel')}
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    className="min-h-11 flex-1 sm:flex-none"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => void handleSave()}
                    isLoading={isSaving}
                    aria-describedby={errorMessage ? errorId : undefined}
                  >
                    {t('lesson.save')}
                  </Button>
                </div>
                {errorMessage ? (
                  <p
                    id={errorId}
                    role="alert"
                    className="mt-3 font-body text-sm font-medium text-red-700 dark:text-red-300"
                  >
                    {errorMessage}
                  </p>
                ) : null}
              </div>
            ) : (
              <div
                className="mt-3 font-body text-text-primary prose prose-sm max-w-none
                  [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
                  [&_h3]:font-semibold [&_h3]:text-base [&_p]:my-1"
              >
                {viewContent ?? (
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
