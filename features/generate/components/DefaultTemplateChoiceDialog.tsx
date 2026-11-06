'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useT } from '@/providers/locale';
import { useZenMode } from '@/providers/zen-mode';

type DefaultTemplateChoiceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onThisLessonOnly: () => void;
  onEveryNewLesson: () => void | Promise<void>;
  everyNewLoading?: boolean;
};

function getModalCloseMs(): number {
  if (typeof window === 'undefined') return 150;
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--modal-close-dur');
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : 150;
}

function getPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function DefaultTemplateChoiceDialog({
  open,
  onOpenChange,
  onThisLessonOnly,
  onEveryNewLesson,
  everyNewLoading = false,
}: DefaultTemplateChoiceDialogProps) {
  const t = useT();
  const { zenMode } = useZenMode();
  const [prefersReduced, setPrefersReduced] = useState(getPrefersReducedMotion);
  const [isClosing, setIsClosing] = useState(false);
  const thisLessonRef = useRef<HTMLButtonElement>(null);
  const everyNewInFlightRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (open) {
      thisLessonRef.current?.focus();
    }
  }, [open]);

  const requestClose = useCallback(() => {
    onThisLessonOnly();
    if (prefersReduced || zenMode) {
      onOpenChange(false);
      return;
    }
    setIsClosing(true);
    window.setTimeout(() => {
      setIsClosing(false);
      onOpenChange(false);
    }, getModalCloseMs());
  }, [onOpenChange, onThisLessonOnly, prefersReduced, zenMode]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) {
        onOpenChange(true);
        return;
      }
      requestClose();
    },
    [onOpenChange, requestClose],
  );

  const handleEveryNew = async () => {
    if (everyNewInFlightRef.current || everyNewLoading) return;
    everyNewInFlightRef.current = true;
    try {
      await onEveryNewLesson();
      onOpenChange(false);
    } finally {
      everyNewInFlightRef.current = false;
    }
  };

  const motionEnabled = !prefersReduced && !zenMode;
  const visuallyOpen = open && !isClosing;
  const footerButtonClassName =
    'h-auto min-h-11 w-full shrink whitespace-normal px-3 py-2.5 text-center leading-snug sm:min-h-10';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-md border-0 bg-transparent p-0 shadow-none ring-0"
        onInteractOutside={requestClose}
        onEscapeKeyDown={requestClose}
      >
        <div
          className={cn(
            't-modal flex flex-col overflow-hidden rounded-xl bg-background shadow-xl ring-1 ring-border',
            visuallyOpen && 'is-open',
            motionEnabled && isClosing && 'is-closing',
          )}
        >
          <div className="flex flex-col gap-4 p-6">
            <DialogTitle className="font-display text-lg font-semibold text-text-primary">
              {t('generate.upload.choiceTitle')}
            </DialogTitle>
          </div>
          <div className="flex flex-col gap-2 border-t border-border bg-muted/40 p-4">
            <Button
              ref={thisLessonRef}
              type="button"
              variant="outline"
              className={footerButtonClassName}
              autoFocus
              onClick={() => {
                onThisLessonOnly();
                onOpenChange(false);
              }}
            >
              {t('generate.upload.choiceThisLesson')}
            </Button>
            <Button
              type="button"
              className={footerButtonClassName}
              onClick={() => void handleEveryNew()}
              isLoading={everyNewLoading}
              disabled={everyNewLoading}
            >
              {t('generate.upload.choiceEveryNew')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
