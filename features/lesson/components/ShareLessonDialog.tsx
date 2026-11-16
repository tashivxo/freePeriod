'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { DownloadIcon } from '@/components/ui/icons/download';
import { SendIcon } from '@/components/ui/icons/send';
import { MotionSafeIcon } from '@/components/ui/icons/MotionSafeIcon';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { PendingStatus } from '@/components/ui/pending-status';
import { downloadBlob } from '@/lib/download-blob';
import { canShareLessonFile, canUseNativeWebShare } from '@/lib/share/web-share';
import { LessonDialogChrome } from '@/features/lesson/components/LessonDialogChrome';
import { useCreateLessonShare } from '@/features/lesson/hooks/useCreateLessonShare';
import { useT } from '@/providers/locale';

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
  const { loading, error, share } = useCreateLessonShare({
    open,
    lessonId,
    onOpenChange,
    onBeforeShare,
  });
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setCopyState('idle');
      setDownloadError(null);
    }
  }, [open]);

  const showSend = useMemo(() => {
    if (!share || !canUseNativeWebShare()) return false;
    return canShareLessonFile(share.fileName, share.contentType);
  }, [share]);

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
    setDownloadError(null);
    try {
      const response = await fetch(`/api/share/${share.token}/download`);
      if (!response.ok) {
        setDownloadError(t('share.downloadError'));
        return;
      }
      downloadBlob(await response.blob(), share.fileName);
    } catch {
      setDownloadError(t('share.downloadError'));
    }
  };

  const handleSendFile = async () => {
    if (!share || !canUseNativeWebShare()) return;
    setDownloadError(null);
    try {
      const response = await fetch(`/api/share/${share.token}/download`);
      if (!response.ok) {
        setDownloadError(t('share.downloadError'));
        return;
      }
      const blob = await response.blob();
      const file = new File([blob], share.fileName, { type: share.contentType });
      const payload: ShareData = { title: lessonTitle, url: share.url, files: [file] };
      if (!navigator.canShare(payload)) return;
      await navigator.share(payload);
    } catch {
      // User dismissed or share failed — Download remains available.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-5 p-6 sm:max-w-md"
        aria-busy={loading || undefined}
      >
        <LessonDialogChrome title={t('share.dialogTitle')} description={t('share.dialogDescription')} />

        {loading ? <PendingStatus layout="inset" message={t('share.preparing')} /> : null}

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

            {downloadError ? (
              <p className="font-body text-sm text-destructive" role="alert">
                {downloadError}
              </p>
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