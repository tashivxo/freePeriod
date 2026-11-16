'use client';

import type { RefObject } from 'react';
import { Button } from '@/components/ui/Button';
import { useT } from '@/providers/locale';

type LessonCardDeleteOverlayProps = {
  lessonTitle: string;
  deleteFailed: boolean;
  deleting: boolean;
  cancelRef: RefObject<HTMLButtonElement | null>;
  onCancel: () => void;
  onConfirm: () => void;
  onDismissEscape: () => void;
};

export function LessonCardDeleteOverlay({
  lessonTitle,
  deleteFailed,
  deleting,
  cancelRef,
  onCancel,
  onConfirm,
  onDismissEscape,
}: LessonCardDeleteOverlayProps) {
  const t = useT();

  return (
    <div
      role="alertdialog"
      aria-label={t('history.deleteConfirm', { title: lessonTitle })}
      className="absolute inset-0 flex items-center justify-center rounded-xl bg-surface"
      onContextMenu={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onDismissEscape();
        }
      }}
    >
      <div className="px-4 text-center">
        <p className="mb-3 text-sm font-body text-text-primary">
          {t('history.deleteConfirm', { title: lessonTitle })}
        </p>
        {deleteFailed && (
          <p role="alert" className="mb-3 text-sm font-body text-destructive">
            {t('history.deleteError')}
          </p>
        )}
        <div className="flex justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            ref={cancelRef}
            onClick={onCancel}
            className="h-auto min-h-11 px-4 py-2.5 text-xs sm:h-auto sm:min-h-0"
          >
            {t('lesson.cancel')}
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={onConfirm}
            isLoading={deleting}
            className="h-auto min-h-11 px-4 py-2.5 text-xs sm:h-auto sm:min-h-0 bg-red-700 text-white hover:bg-red-800"
          >
            {t('history.delete')}
          </Button>
        </div>
      </div>
    </div>
  );
}