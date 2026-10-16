'use client';

import { useEffect, useId, useRef, useState, type DragEvent } from 'react';
import { Check, X } from 'lucide-react';
import { UploadIcon } from '@/components/ui/icons/upload';
import { XIcon } from '@/components/ui/icons/x';
import { MotionSafeIcon } from '@/components/ui/icons/MotionSafeIcon';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useMotionSafeIconRef } from '@/hooks/useMotionSafeIconRef';
import { getTemplateFileRejection } from '@/lib/lesson/template-path';
import {
  DEFAULT_MAX_UPLOAD_BYTES,
  formatAcceptTypes,
  formatFileSize,
} from '@/lib/utils/file-input';
import { cn } from '@/lib/utils';
import { useLocale, useT } from '@/providers/locale';
import type { UploadType } from '@/types';

interface DocumentUploadZoneProps {
  label: string;
  accept: string;
  uploadType: UploadType;
  onUploadComplete: (storagePath: string) => void;
  onRemove: () => void;
  onBusyChange?: (busy: boolean) => void;
  maxSizeBytes?: number;
}

/** Darkened coral for light-mode links. 6.42:1 on white, 5.02:1 on the drag tint. */
export const UPLOAD_ACTION_COLOR_LIGHT = '#A33760';
/** Coral-300 for dark-mode links. 11.11:1 on #171717, 5.79:1 on the drag tint. */
export const UPLOAD_ACTION_COLOR_DARK = '#FFB8D0';
export const UPLOAD_DRAG_BORDER = 'var(--color-coral)';
export const UPLOAD_DRAG_BORDER_LIGHT = '#B5486F';
export const UPLOAD_DRAG_BORDER_DARK = '#FF8BB0';
export const UPLOAD_ERROR_COLOR_LIGHT = '#B91C1C';
export const UPLOAD_ERROR_COLOR_DARK = '#FCA5A5';
export const UPLOAD_DRAG_BACKGROUND =
  'color-mix(in srgb, var(--color-coral) 32%, var(--color-surface))';

const ACTION_COLOR_CLASS = 'text-[#A33760] dark:text-[#FFB8D0]';
const ERROR_TEXT_CLASS = 'text-[#B91C1C] dark:text-[#FCA5A5]';

export type UploadErrorKind =
  | 'auth'
  | 'tooLarge'
  | 'wrongType'
  | 'empty'
  | 'network'
  | 'noText'
  | 'timeout'
  | 'parse'
  | 'generic';

const ERROR_KEYS: Record<UploadErrorKind, `generate.upload.${string}`> = {
  auth: 'generate.upload.errorAuth',
  tooLarge: 'generate.upload.errorTooLarge',
  wrongType: 'generate.upload.errorWrongType',
  empty: 'generate.upload.errorEmpty',
  network: 'generate.upload.errorNetwork',
  noText: 'generate.upload.errorNoText',
  timeout: 'generate.upload.errorTimeout',
  parse: 'generate.upload.errorParse',
  generic: 'generate.upload.errorGeneric',
};

export function classifyUploadError(raw: string): UploadErrorKind {
  const message = raw.trim().toLowerCase();
  if (!message) return 'generic';

  if (
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('network error') ||
    message.includes('network') ||
    message.includes('retryable') ||
    message === 'upload failed' ||
    message.includes('load failed') ||
    message.includes('offline')
  ) {
    return 'network';
  }

  if (
    message.includes('not authenticated') ||
    message.includes('unauthenticated') ||
    message.includes('unauthorized') ||
    message.includes('auth session missing') ||
    message.includes('jwt')
  ) {
    return 'auth';
  }

  if (
    message.includes('exceeds the maximum size') ||
    message.includes('too large') ||
    message.includes('payload too large') ||
    message.includes('entity too large')
  ) {
    return 'tooLarge';
  }

  if (
    message.includes('files are accepted') ||
    message.includes('file type') ||
    message.includes('need to be .pdf') ||
    message.includes('not supported') ||
    message.includes('mime')
  ) {
    return 'wrongType';
  }

  if (message.includes('is empty') || message.includes('empty file')) {
    return 'empty';
  }

  if (
    message.includes('no extractable text') ||
    message.includes('no readable text') ||
    message.includes('scanned pdf')
  ) {
    return 'noText';
  }

  if (message.includes('taking too long')) {
    return 'timeout';
  }

  if (message.includes('could not be processed')) {
    return 'parse';
  }

  return 'generic';
}

function uploadErrorVars(
  raw: string,
  kind: UploadErrorKind,
  maxSizeBytes: number,
  locale: string,
  fileFallback: string,
): Record<string, string> {
  if (kind === 'tooLarge') {
    const match = raw.match(/^(.+?) exceeds the maximum size of /i);
    return {
      name: match?.[1] ?? fileFallback,
      size: formatFileSize(maxSizeBytes, locale),
    };
  }
  if (kind === 'empty') {
    const match = raw.match(/^(.+?) is empty/i);
    return { name: match?.[1] ?? fileFallback };
  }
  return {};
}

export function DocumentUploadZone({
  label: _label,
  accept,
  uploadType,
  onUploadComplete,
  onRemove,
  onBusyChange,
  maxSizeBytes = DEFAULT_MAX_UPLOAD_BYTES,
}: DocumentUploadZoneProps) {
  const t = useT();
  const { locale } = useLocale();
  const inputId = useId();
  const helpId = useId();
  const sectionHeading =
    uploadType === 'curriculum_doc'
      ? t('generate.upload.curriculumHeading')
      : t('generate.upload.templateHeading');
  const [isDragging, setIsDragging] = useState(false);
  const dragCountRef = useRef(0);

  const { file, storagePath, parsedText, isUploading, phase, error, handleFile, rejectFile, removeFile } = useFileUpload({
    uploadType,
    accept,
    maxSizeBytes,
  });
  const hadPathRef = useRef(false);

  const { ref: errorIconRef, animationDisabled: errorIconMotionDisabled } =
    useMotionSafeIconRef();

  useEffect(() => {
    if (!error || errorIconMotionDisabled) return;
    errorIconRef.current?.startAnimation();
  }, [error, errorIconMotionDisabled, errorIconRef]);

  useEffect(() => {
    onBusyChange?.(isUploading);
  }, [isUploading, onBusyChange]);

  // Notify parent when storagePath is set after a successful upload; clear if it drops.
  useEffect(() => {
    if (storagePath) {
      hadPathRef.current = true;
      onUploadComplete(storagePath);
    } else if (hadPathRef.current) {
      hadPathRef.current = false;
      onRemove();
    }
  }, [storagePath, onUploadComplete, onRemove]);

  const selectFile = (selected: File | undefined) => {
    if (!selected) return;
    if (uploadType === 'template') {
      const rejection = getTemplateFileRejection(selected);
      if (rejection) {
        rejectFile(rejection);
        return;
      }
    }
    void handleFile(selected);
  };

  const handleRemove = async () => {
    await removeFile();
    onRemove();
  };

  const handleDragEnter = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragCountRef.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragCountRef.current -= 1;
    if (dragCountRef.current <= 0) {
      dragCountRef.current = 0;
      setIsDragging(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragCountRef.current = 0;
    setIsDragging(false);
    if (isUploading) return;
    selectFile(event.dataTransfer.files?.[0]);
  };

  const ext = file?.name.split('.').pop()?.toUpperCase() ?? '';
  const showProgress = phase === 'uploading' || phase === 'parsing';
  const fileFallback = t('generate.upload.fileFallback');
  const progressLabel =
    phase === 'parsing'
      ? t('generate.upload.readingFile', { name: file?.name ?? fileFallback })
      : t('generate.upload.uploadingFile', { name: file?.name ?? fileFallback });
  const helpText = `${formatAcceptTypes(accept, t('generate.upload.filesSuffix'))} · ${t(
    'generate.upload.helpMax',
    { size: formatFileSize(maxSizeBytes, locale) },
  )}`;
  const errorKind = error ? classifyUploadError(error) : null;
  const friendlyError = errorKind
    ? t(
        ERROR_KEYS[errorKind],
        uploadErrorVars(error ?? '', errorKind, maxSizeBytes, locale, fileFallback),
      )
    : null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
        {sectionHeading}
      </p>

      <label
        htmlFor={inputId}
        data-dragging={isDragging ? 'true' : 'false'}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 p-4',
          'transition-[border-color,background-color] duration-150 motion-reduce:transition-none',
          'focus-within:outline focus-within:outline-2 focus-within:outline-offset-2',
          isDragging ? 'border-solid border-[#B5486F] dark:border-[#FF8BB0]' : 'border-dashed',
          isUploading && 'pointer-events-none opacity-60',
        )}
        style={{
          borderWidth: '2px',
          borderColor: isDragging ? undefined : 'var(--color-border)',
          backgroundColor: isDragging ? UPLOAD_DRAG_BACKGROUND : 'var(--color-surface)',
          outlineColor: 'var(--color-primary)',
        }}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <MotionSafeIcon
            icon={UploadIcon}
            size={24}
            className="text-[var(--color-text-secondary)]"
          />
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {phase === 'uploading' ? (
              t('generate.upload.uploading')
            ) : phase === 'parsing' ? (
              t('generate.upload.parsing')
            ) : (
              <>
                {t('generate.upload.dragDropPrompt')}{' '}
                <span className={`font-medium underline ${ACTION_COLOR_CLASS}`}>
                  {t('generate.upload.browse')}
                </span>
              </>
            )}
          </span>
        </div>
      </label>

      <input
        id={inputId}
        type="file"
        aria-label={
          uploadType === 'curriculum_doc'
            ? t('generate.upload.inputAriaCurriculum')
            : t('generate.upload.inputAriaTemplate')
        }
        aria-describedby={helpId}
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const selected = e.target.files?.[0];
          e.target.value = '';
          selectFile(selected);
        }}
      />

      <p id={helpId} className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        {helpText}
      </p>

      {file && (
        <ul className="space-y-2" aria-label={t('generate.upload.selectedFile')} aria-live="polite">
          <li
            className="flex w-full items-center gap-3 rounded-lg border p-3"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
            }}
          >
            {phase === 'ready' && !error ? (
              <Check
                className="h-4 w-4 shrink-0"
                style={{ color: 'var(--color-success)' }}
                aria-hidden
              />
            ) : null}
            <span
              className="rounded px-1.5 py-0.5 text-xs font-semibold uppercase"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-surface)',
              }}
            >
              {ext}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span
                  className="truncate text-sm"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {file.name}
                </span>
                <span
                  className="shrink-0 text-xs"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {formatFileSize(file.size, locale)}
                </span>
              </div>
              {showProgress ? (
                <div
                  className="mt-2 h-1 overflow-hidden rounded-full"
                  role="progressbar"
                  aria-label={progressLabel}
                  style={{ backgroundColor: 'var(--color-border)' }}
                >
                  <div
                    className="h-full w-1/3 animate-pulse rounded-full motion-reduce:animate-none"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  />
                </div>
              ) : null}
            </div>
            {phase === 'error' ? (
              <button
                type="button"
                aria-label={t('generate.upload.retryAria', { name: file.name })}
                onClick={() => {
                  void handleFile(file);
                }}
                className={`shrink-0 text-sm font-medium underline-offset-2 hover:underline focus:outline focus:outline-2 focus:outline-offset-2 ${ACTION_COLOR_CLASS}`}
                style={{ outlineColor: 'var(--color-primary)' }}
              >
                {t('generate.upload.retry')}
              </button>
            ) : null}
            <button
              type="button"
              aria-label={t('generate.upload.removeAria', { name: file.name })}
              disabled={isUploading}
              onClick={() => {
                void handleRemove();
              }}
              className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-md transition-opacity hover:opacity-70 focus:outline focus:outline-2 focus:outline-offset-2 disabled:pointer-events-none disabled:opacity-50"
              style={{ outlineColor: 'var(--color-primary)' }}
            >
              <X className="h-4 w-4" style={{ color: 'var(--color-text-secondary)' }} />
            </button>
          </li>
        </ul>
      )}

      {uploadType === 'curriculum_doc' && parsedText && (
        <div
          role="region"
          aria-label={t('generate.upload.extractedRegion')}
          className="max-h-64 overflow-y-auto rounded-lg border border-border bg-background p-3"
        >
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-secondary">
            {t('generate.upload.extractedText')}
          </p>
          <pre className="whitespace-pre-wrap break-words text-sm text-text-primary">
            {parsedText}
          </pre>
        </div>
      )}

      {phase === 'ready' && !error && (
        <p role="status" className="text-sm text-success">
          {t('generate.upload.ready')}
        </p>
      )}

      {friendlyError && (
        <div role="alert" className={`flex gap-3 rounded-xl bg-error/10 p-3 ${ERROR_TEXT_CLASS}`}>
          <XIcon
            ref={errorIconRef}
            size={24}
            animationDisabled={errorIconMotionDisabled}
            aria-hidden
            className="mt-0.5 shrink-0"
          />
          <p className={`font-body text-sm ${ERROR_TEXT_CLASS}`}>{friendlyError}</p>
        </div>
      )}
    </div>
  );
}
