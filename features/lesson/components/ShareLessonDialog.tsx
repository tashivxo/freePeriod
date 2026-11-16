'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { DownloadIcon } from '@/components/ui/icons/download';
import { SendIcon } from '@/components/ui/icons/send';
import { MotionSafeIcon } from '@/components/ui/icons/MotionSafeIcon';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { downloadBlob } from '@/lib/download-blob';
import { useT } from '@/providers/locale';

type ShareResult = {
  url: string;
  fileName: string;
  contentType: string;
  usedDocxFallback: boolean;
  token: string;
};

type ShareLessonDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: string;
  lessonTitle: string;
  /** When set (lesson page), run before POST — e.g. flush autosave. Return false to abort. */
  onBeforeShare?: () => Promise<boolean>;
};

export function ShareLessonDialog({
  open,
  onOpenChange,
  lessonId,
  lessonTitle,
  onBeforeShare,
}: ShareLessonDialogProps) {
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [share, setShare] = useState<ShareResult | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const urlInputRef = useRef<HTMLInputElement>(null);
  const shareRequestRef = useRef(0);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setShare(null);
    setCopyState('idle');
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }

    const requestId = ++shareRequestRef.current;
    let cancelled = false;

    async function runShare() {
      setLoading(true);
      setError(null);
      setShare(null);
      setCopyState('idle');

      if (onBeforeShare) {
        const ok = await onBeforeShare();
        if (!ok) {
          if (cancelled || requestId !== shareRequestRef.current) return;
          setLoading(false);
          onOpenChange(false);
          return;
        }
      }

      try {
        const response = await fetch(`/api/lessons/${lessonId}/share`, { method: 'POST' });
        if (cancelled || requestId !== shareRequestRef.current) return;

        if (!response.ok) {
          setError(t('share.error'));
          setLoading(false);
          return;
        }

        const body = (await response.json()) as ShareResult;
        setShare(body);
      } catch {
        if (cancelled || requestId !== shareRequestRef.current) return;
        setError(t('share.error'));
      } finally {
        if (!cancelled && requestId === shareRequestRef.current) {
          setLoading(false);
        }
      }
    }

    void runShare();

    return () => {
      cancelled = true;
    };
  }, [lessonId, onBeforeShare, onOpenChange, open, reset, t]);

  const handleCopy = async () => {
    if (!share?.url) return;
    try {
      await navigator.clipboard.writeText(share.url);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
      urlInputRef.current?.focus();
      urlInputRef.current?.select();
    }
  };

  const handleDownload = async () => {
    if (!share) return;
    const response = await fetch(`/api/share/${share.token}/download`);
    if (!response.ok) return;
    downloadBlob(await response.blob(), share.fileName);
  };

  const canNativeShare =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function';

  const handleSendFile = async () => {
    if (!share || !canNativeShare) return;
    try {
      const response = await fetch(`/api/share/${share.token}/download`);
      if (!response.ok) return;
      const blob = await response.blob();
      const file = new File([blob], share.fileName, { type: share.contentType });
      const payload: ShareData = { title: lessonTitle, url: share.url, files: [file] };
      if (!navigator.canShare(payload)) return;
      await navigator.share(payload);
    } catch {
      // User dismissed or share failed — Download remains available.
    }
  };

  const showSend =
    canNativeShare &&
    share != null &&
    typeof navigator.canShare === 'function' &&
    (() => {
      try {
        const testFile = new File([''], share.fileName, { type: share.contentType });
        return navigator.canShare({ files: [testFile] });
      } catch {
        return false;
      }
    })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-5 p-6 sm:max-w-md"
        aria-busy={loading || undefined}
      >
        <div className="flex flex-col gap-1">
          <DialogTitle className="font-display text-lg font-semibold text-text-primary">
            {t('share.dialogTitle')}
          </DialogTitle>
          <DialogDescription className="font-body text-sm text-text-secondary">
            {t('share.dialogDescription')}
          </DialogDescription>
        </div>

        {loading ? (
          <div
            role="status"
            aria-live="polite"
            className="flex min-h-[7.5rem] flex-col items-center justify-center gap-2"
          >
            <Loader2
              className="h-5 w-5 shrink-0 text-coral motion-safe:animate-spin"
              aria-hidden
            />
            <p className="font-body text-sm text-text-secondary text-center text-pretty">
              {t('share.preparing')}
            </p>
          </div>
        ) : null}

        {error ? (
          <p className="font-body text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {share ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="share-url" className="sr-only">
                {t('share.linkLabel')}
              </label>
              <div className="flex gap-2">
                <input
                  id="share-url"
                  ref={urlInputRef}
                  readOnly
                  value={share.url}
                  className="min-h-11 flex-1 rounded-lg border border-border bg-muted/40 px-3 font-body text-sm text-text-primary"
                  onFocus={(e) => e.target.select()}
                />
                <Button type="button" variant="outline" className="shrink-0" onClick={() => void handleCopy()}>
                  {copyState === 'copied' ? t('share.copied') : t('share.copyLink')}
                </Button>
              </div>
              {copyState === 'failed' ? (
                <p className="font-body text-xs text-text-secondary">{t('share.copyFailed')}</p>
              ) : null}
            </div>

            {share.usedDocxFallback ? (
              <p className="font-body text-xs text-text-secondary">{t('share.docxFallbackNote')}</p>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row">
              {showSend ? (
                <Button type="button" variant="soft" className="flex-1" onClick={() => void handleSendFile()}>
                  <MotionSafeIcon icon={SendIcon} size={20} className="me-2" parentHover parentFocus />
                  {t('share.sendFile')}
                </Button>
              ) : null}
              <Button type="button" variant="secondary" className="flex-1" onClick={() => void handleDownload()}>
                <MotionSafeIcon icon={DownloadIcon} size={20} className="me-2" parentHover parentFocus />
                {t('share.downloadFile')}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}