'use client';

import { useRef, useState, type MutableRefObject } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog';
import { LessonDialogChrome } from '@/features/lesson/components/LessonDialogChrome';
import { useT } from '@/providers/locale';

/** Matches the longest title the generator produces; keeps cards readable. */
export const LESSON_TITLE_MAX_LENGTH = 200;

type RenameFormProps = {
  initialTitle: string;
  onSave: (title: string) => void | Promise<void>;
};

function RenameForm({ initialTitle, onSave }: RenameFormProps) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const trimmed = draft.trim();
  const isBlank = trimmed.length === 0;
  const canSave = !isBlank && trimmed !== initialTitle && !saving;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setFailed(false);
    try {
      await onSave(trimmed);
    } catch {
      setFailed(true);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="rename-lesson-title"
          className="font-body text-sm font-medium text-text-primary"
        >
          {t('history.renameLabel')}
        </label>
        <input
          ref={inputRef}
          id="rename-lesson-title"
          type="text"
          value={draft}
          maxLength={LESSON_TITLE_MAX_LENGTH}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => {
            setDraft(event.target.value);
            setFailed(false);
          }}
          aria-invalid={isBlank || failed || undefined}
          className="h-12 w-full rounded-xl border-2 border-border bg-surface px-3 text-base font-body text-text-primary hover:border-coral/60 focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20"
        />
        {isBlank && (
          <p role="alert" className="font-body text-sm text-destructive">
            {t('history.titleRequired')}
          </p>
        )}
        {failed && (
          <p role="alert" className="font-body text-sm text-destructive">
            {t('history.renameError')}
          </p>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            {t('lesson.cancel')}
          </Button>
        </DialogClose>
        <Button type="submit" disabled={!canSave} isLoading={saving}>
          {t('lesson.save')}
        </Button>
      </div>
    </form>
  );
}

type RenameLessonDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonTitle: string;
  onSave: (title: string) => void | Promise<void>;
  onCloseAutoFocus: (event: Event) => void;
  savingRef: MutableRefObject<boolean>;
};

export function RenameLessonDialog({
  open,
  onOpenChange,
  lessonTitle,
  onSave,
  onCloseAutoFocus,
  savingRef,
}: RenameLessonDialogProps) {
  const t = useT();

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && savingRef.current) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="gap-5 p-6 sm:max-w-md"
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <LessonDialogChrome
          title={t('history.renameDialogTitle')}
          description={lessonTitle}
          descriptionClassName="sr-only"
        />
        <RenameForm initialTitle={lessonTitle} onSave={onSave} />
      </DialogContent>
    </Dialog>
  );
}