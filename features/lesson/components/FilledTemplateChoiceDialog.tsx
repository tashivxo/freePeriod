'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { XIcon } from '@/components/ui/icons/x';
import { Button } from '@/components/ui/Button';
import { useMotionSafeIconRef } from '@/hooks/useMotionSafeIconRef';
import { useFileUpload } from '@/hooks/useFileUpload';
import { cn } from '@/lib/utils';
import { useZenMode } from '@/providers/zen-mode';
import {
  BTN_DOWNLOAD_FREEPERIOD_GENERATED_LESSON_PLAN,
  BTN_DOWNLOAD_FREEPERIOD_TEMPLATE,
  BTN_UPLOAD_ONE_NOW,
  BTN_USE_SHARED_TEMPLATE,
  FILLED_TEMPLATE_HAS_TEMPLATE_MESSAGE,
  FILLED_TEMPLATE_NO_TEMPLATE_MESSAGE,
  FILLED_TEMPLATE_PDF_NOTE,
} from './filled-template-copy';

export type FilledTemplateDialogVariant = 'has-template' | 'no-template';

type FilledTemplateChoiceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: string;
  variant: FilledTemplateDialogVariant;
  showPdfNote: boolean;
  onFreePeriodDownload: () => void | Promise<void>;
  onUseSharedTemplate: () => void | Promise<void>;
  onTemplateAttached: (templatePath: string) => void;
  freePeriodLoading: boolean;
  sharedTemplateLoading: boolean;
  dialogActionError?: string | null;
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

export function FilledTemplateChoiceDialog({
  open,
  onOpenChange,
  lessonId,
  variant,
  showPdfNote,
  onFreePeriodDownload,
  onUseSharedTemplate,
  onTemplateAttached,
  freePeriodLoading,
  sharedTemplateLoading,
  dialogActionError = null,
}: FilledTemplateChoiceDialogProps) {
  const inputId = useId();
  const { zenMode } = useZenMode();
  const [prefersReduced, setPrefersReduced] = useState(getPrefersReducedMotion);
  const [isClosing, setIsClosing] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [isAttaching, setIsAttaching] = useState(false);
  const attachedPathRef = useRef<string | null>(null);
  const { ref: noTemplateIconRef, animationDisabled: noTemplateIconMotionDisabled } =
    useMotionSafeIconRef();

  const { storagePath, isUploading, error: uploadError, handleFile } = useFileUpload({
    uploadType: 'template',
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!open) {
      attachedPathRef.current = null;
      setAttachError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || variant !== 'no-template' || noTemplateIconMotionDisabled) return;
    noTemplateIconRef.current?.startAnimation();
  }, [noTemplateIconMotionDisabled, noTemplateIconRef, open, variant]);

  const requestClose = useCallback(() => {
    if (prefersReduced || zenMode) {
      onOpenChange(false);
      return;
    }
    setIsClosing(true);
    window.setTimeout(() => {
      setIsClosing(false);
      onOpenChange(false);
    }, getModalCloseMs());
  }, [onOpenChange, prefersReduced, zenMode]);

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

  useEffect(() => {
    if (!open || !storagePath || storagePath === attachedPathRef.current) return;

    attachedPathRef.current = storagePath;
    let cancelled = false;

    async function attachTemplate() {
      setIsAttaching(true);
      setAttachError(null);
      try {
        const response = await fetch(`/api/lessons/${lessonId}/template`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ templatePath: storagePath }),
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? 'Failed to attach template');
        }

        const data = (await response.json()) as {
          lesson: { template_path: string };
        };
        if (!cancelled) {
          onTemplateAttached(data.lesson.template_path);
        }
      } catch (err) {
        if (!cancelled) {
          setAttachError(err instanceof Error ? err.message : 'Failed to attach template');
          attachedPathRef.current = null;
        }
      } finally {
        if (!cancelled) setIsAttaching(false);
      }
    }

    void attachTemplate();
    return () => {
      cancelled = true;
    };
  }, [lessonId, onTemplateAttached, open, storagePath]);

  const motionEnabled = !prefersReduced && !zenMode;
  const visuallyOpen = open && !isClosing;
  const footerButtonClassName =
    'h-auto min-h-10 w-full shrink whitespace-normal px-3 py-2.5 text-center leading-snug';

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
                Download filled template
              </DialogTitle>
              {variant === 'has-template' ? (
                <DialogDescription className="font-body text-sm text-text-secondary">
                  {FILLED_TEMPLATE_HAS_TEMPLATE_MESSAGE}
                </DialogDescription>
              ) : (
                <div
                  role="alert"
                  className="flex gap-3 rounded-xl bg-error/10 p-3 text-error"
                >
                  <XIcon
                    ref={noTemplateIconRef}
                    size={24}
                    animationDisabled={noTemplateIconMotionDisabled}
                    aria-hidden
                    className="mt-0.5 shrink-0"
                  />
                  <DialogDescription className="font-body text-sm text-error">
                    {FILLED_TEMPLATE_NO_TEMPLATE_MESSAGE}
                  </DialogDescription>
                </div>
              )}
              {showPdfNote ? (
                <p className="text-sm text-text-secondary">{FILLED_TEMPLATE_PDF_NOTE}</p>
              ) : null}
              {(dialogActionError || uploadError || attachError) && (
                <p role="alert" className="text-sm font-medium text-error">
                  {dialogActionError ?? uploadError ?? attachError}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-border bg-muted/40 p-4">
              {variant === 'has-template' ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    className={footerButtonClassName}
                    onClick={() => void onFreePeriodDownload()}
                    isLoading={freePeriodLoading}
                  >
                    {BTN_DOWNLOAD_FREEPERIOD_TEMPLATE}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={footerButtonClassName}
                    onClick={() => void onUseSharedTemplate()}
                    isLoading={sharedTemplateLoading}
                  >
                    {BTN_USE_SHARED_TEMPLATE}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    className={footerButtonClassName}
                    onClick={() => document.getElementById(inputId)?.click()}
                    isLoading={isUploading || isAttaching}
                  >
                    {BTN_UPLOAD_ONE_NOW}
                  </Button>
                  <input
                    id={inputId}
                    type="file"
                    accept=".docx,.xlsx,.xls"
                    className="sr-only"
                    onChange={(e) => {
                      const selected = e.target.files?.[0];
                      if (!selected) return;
                      void handleFile(selected);
                      e.target.value = '';
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className={footerButtonClassName}
                    onClick={() => void onFreePeriodDownload()}
                    isLoading={freePeriodLoading}
                  >
                    {BTN_DOWNLOAD_FREEPERIOD_GENERATED_LESSON_PLAN}
                  </Button>
                </>
              )}
            </div>
          </div>
      </DialogContent>
    </Dialog>
  );
}
