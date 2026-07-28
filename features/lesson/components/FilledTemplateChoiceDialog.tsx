'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { useFileUpload } from '@/hooks/useFileUpload';
import { cn } from '@/lib/utils';
import { useZenMode } from '@/providers/zen-mode';
import {
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
}: FilledTemplateChoiceDialogProps) {
  const inputId = useId();
  const { zenMode } = useZenMode();
  const [prefersReduced, setPrefersReduced] = useState(getPrefersReducedMotion);
  const [isClosing, setIsClosing] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [isAttaching, setIsAttaching] = useState(false);
  const attachedPathRef = useRef<string | null>(null);

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
              <DialogDescription className="font-body text-sm text-text-secondary">
                {variant === 'has-template'
                  ? FILLED_TEMPLATE_HAS_TEMPLATE_MESSAGE
                  : FILLED_TEMPLATE_NO_TEMPLATE_MESSAGE}
              </DialogDescription>
              {showPdfNote ? (
                <p className="text-sm text-text-secondary">{FILLED_TEMPLATE_PDF_NOTE}</p>
              ) : null}
              {(uploadError || attachError) && (
                <p role="alert" className="text-sm font-medium text-error">
                  {uploadError ?? attachError}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-border bg-muted/40 p-4 sm:flex-row sm:justify-end">
              {variant === 'has-template' ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void onFreePeriodDownload()}
                    isLoading={freePeriodLoading}
                  >
                    FreePeriod template
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void onUseSharedTemplate()}
                    isLoading={sharedTemplateLoading}
                  >
                    Use your template
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => document.getElementById(inputId)?.click()}
                    isLoading={isUploading || isAttaching}
                  >
                    Upload one now
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
                    onClick={() => void onFreePeriodDownload()}
                    isLoading={freePeriodLoading}
                  >
                    Download FreePeriod generated lesson plan
                  </Button>
                </>
              )}
            </div>
          </div>
      </DialogContent>
    </Dialog>
  );
}
