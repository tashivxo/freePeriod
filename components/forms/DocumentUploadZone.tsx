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

const SECTION_HEADINGS: Record<UploadType, string> = {
  curriculum_doc: 'Curriculum Document',
  template: 'Lesson Plan Template',
};

const PHASE_LABEL: Record<string, string> = {
  uploading: 'Uploading…',
  parsing: 'Reading document…',
};

export function DocumentUploadZone({
  label,
  accept,
  uploadType,
  onUploadComplete,
  onRemove,
  onBusyChange,
  maxSizeBytes = DEFAULT_MAX_UPLOAD_BYTES,
}: DocumentUploadZoneProps) {
  const inputId = useId();
  const helpId = useId();
  const sectionHeading = SECTION_HEADINGS[uploadType];
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
  const progressLabel =
    phase === 'parsing' ? `Reading ${file?.name ?? 'file'}` : `Uploading ${file?.name ?? 'file'}`;
  const helpText = `${formatAcceptTypes(accept)} · Max ${formatFileSize(maxSizeBytes)}`;

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
          isDragging ? 'border-solid' : 'border-dashed',
          isUploading && 'pointer-events-none opacity-60',
        )}
        style={{
          borderColor: isDragging ? 'var(--color-primary)' : 'var(--color-border)',
          backgroundColor: isDragging ? 'var(--color-primary-soft)' : 'var(--color-surface)',
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
            {PHASE_LABEL[phase] ?? (
              <>
                Drag and drop a file here, or{' '}
                <span
                  className="font-medium underline"
                  style={{ color: 'var(--color-primary)' }}
                >
                  browse
                </span>
              </>
            )}
          </span>
        </div>
      </label>

      <input
        id={inputId}
        type="file"
        aria-label={label}
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
        <ul className="space-y-2" aria-label="Selected file" aria-live="polite">
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
                  {formatFileSize(file.size)}
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
                aria-label={`Retry upload of ${file.name}`}
                onClick={() => {
                  void handleFile(file);
                }}
                className="shrink-0 text-sm font-medium underline-offset-2 hover:underline focus:outline focus:outline-2 focus:outline-offset-2"
                style={{ color: 'var(--color-primary)', outlineColor: 'var(--color-primary)' }}
              >
                Retry
              </button>
            ) : null}
            <button
              type="button"
              aria-label={`Remove ${file.name}`}
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
          aria-label="Extracted curriculum text"
          className="max-h-64 overflow-y-auto rounded-lg border border-border bg-background p-3"
        >
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-secondary">
            Extracted text sent to generation
          </p>
          <pre className="whitespace-pre-wrap break-words text-sm text-text-primary">
            {parsedText}
          </pre>
        </div>
      )}

      {phase === 'ready' && !error && (
        <p role="status" className="text-sm text-success">
          Uploaded. Ready to generate.
        </p>
      )}

      {error && (
        <div role="alert" className="flex gap-3 rounded-xl bg-error/10 p-3 text-error">
          <XIcon
            ref={errorIconRef}
            size={24}
            animationDisabled={errorIconMotionDisabled}
            aria-hidden
            className="mt-0.5 shrink-0"
          />
          <p className="font-body text-sm text-error">{error}</p>
        </div>
      )}
    </div>
  );
}
