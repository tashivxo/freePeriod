'use client';

import { useEffect, useId, useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import { Check, X } from 'lucide-react';
import { UploadIcon } from '@/components/ui/icons/upload';
import { MotionSafeIcon } from '@/components/ui/icons/MotionSafeIcon';
import { FieldError } from '@/components/ui/FieldError';
import { useFileUpload } from '@/hooks/useFileUpload';
import {
  UPLOAD_ACTION_COLOR_DARK,
  UPLOAD_ACTION_COLOR_LIGHT,
  UPLOAD_DRAG_BACKGROUND,
  UPLOAD_DRAG_BORDER_DARK,
  UPLOAD_DRAG_BORDER_LIGHT,
  UPLOAD_ERROR_COLOR_DARK,
  UPLOAD_ERROR_COLOR_LIGHT,
} from '@/lib/upload/colors';
import { formatUploadError } from '@/lib/upload/errors';
import {
  DEFAULT_MAX_UPLOAD_BYTES,
  formatAcceptTypes,
  formatFileSize,
} from '@/lib/utils/file-input';
import { cn } from '@/lib/utils';
import { useLocale, useT } from '@/providers/locale';
import type { UploadType } from '@/types';

interface DocumentUploadZoneProps {
  accept: string;
  uploadType: UploadType;
  onUploadComplete: (storagePath: string) => void;
  onRemove: () => void;
  onBusyChange?: (busy: boolean) => void;
  maxSizeBytes?: number;
}

const ACTION_COLOR_CLASS = `text-[${UPLOAD_ACTION_COLOR_LIGHT}] dark:text-[${UPLOAD_ACTION_COLOR_DARK}]`;
const ERROR_TEXT_CLASS = `text-[${UPLOAD_ERROR_COLOR_LIGHT}] dark:text-[${UPLOAD_ERROR_COLOR_DARK}]`;

export function DocumentUploadZone({
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sectionHeading =
    uploadType === 'curriculum_doc'
      ? t('generate.upload.curriculumHeading')
      : t('generate.upload.templateHeading');
  const [isDragging, setIsDragging] = useState(false);
  const dragCountRef = useRef(0);

  const { file, storagePath, parsedText, isUploading, phase, error, handleFile, removeFile } = useFileUpload({
    uploadType,
    accept,
    maxSizeBytes,
  });
  const hadPathRef = useRef(false);

  useEffect(() => {
    onBusyChange?.(isUploading);
  }, [isUploading, onBusyChange]);

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

  const openFilePicker = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleZoneKeyDown = (event: KeyboardEvent<HTMLLabelElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openFilePicker();
    }
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
  const friendlyError = error
    ? formatUploadError(t, {
        ...error,
        vars: {
          ...error.vars,
          name: error.vars?.name ?? fileFallback,
          ...(error.kind === 'tooLarge'
            ? { size: formatFileSize(maxSizeBytes, locale) }
            : {}),
        },
      })
    : null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
        {sectionHeading}
      </p>

      <label
        htmlFor={inputId}
        role="button"
        tabIndex={0}
        data-dragging={isDragging ? 'true' : 'false'}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onKeyDown={handleZoneKeyDown}
        className={cn(
          'flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 p-4',
          'transition-[border-color,background-color] duration-150 motion-reduce:transition-none',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
          `focus-visible:outline-[${UPLOAD_DRAG_BORDER_LIGHT}] dark:focus-visible:outline-[${UPLOAD_DRAG_BORDER_DARK}]`,
          isDragging
            ? `border-solid border-[${UPLOAD_DRAG_BORDER_LIGHT}] dark:border-[${UPLOAD_DRAG_BORDER_DARK}]`
            : 'border-dashed',
          isUploading && 'pointer-events-none opacity-60',
        )}
        style={{
          borderWidth: '2px',
          borderColor: isDragging ? undefined : 'var(--color-border)',
          backgroundColor: isDragging ? UPLOAD_DRAG_BACKGROUND : 'var(--color-surface)',
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
        ref={fileInputRef}
        id={inputId}
        type="file"
        tabIndex={-1}
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
        <FieldError variant="banner" message={friendlyError} className={ERROR_TEXT_CLASS} />
      )}
    </div>
  );
}
