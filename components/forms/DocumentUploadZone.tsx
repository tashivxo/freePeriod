'use client';

import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { UploadIcon } from '@/components/ui/icons/upload';
import { XIcon } from '@/components/ui/icons/x';
import { MotionSafeIcon } from '@/components/ui/icons/MotionSafeIcon';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useMotionSafeIconRef } from '@/hooks/useMotionSafeIconRef';
import { cn } from '@/lib/utils';
import type { UploadType } from '@/types';

interface DocumentUploadZoneProps {
  label: string;
  accept: string;
  uploadType: UploadType;
  onUploadComplete: (storagePath: string) => void;
  onRemove: () => void;
  onBusyChange?: (busy: boolean) => void;
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
}: DocumentUploadZoneProps) {
  const inputId = useId();
  const sectionHeading = SECTION_HEADINGS[uploadType];

  const { file, storagePath, parsedText, isUploading, phase, error, handleFile, removeFile } = useFileUpload({
    uploadType,
    accept,
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

  const handleRemove = async () => {
    await removeFile();
    onRemove();
  };

  const ext = file?.name.split('.').pop()?.toUpperCase() ?? '';

  return (
    <div className="space-y-1">
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
        {sectionHeading}
      </p>

      <label
        htmlFor={inputId}
        className={cn(
          'flex min-h-[44px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors',
          'focus-within:outline focus-within:outline-2 focus-within:outline-offset-2',
          isUploading && 'pointer-events-none opacity-60',
        )}
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          outlineColor: 'var(--color-primary)',
        }}
      >
        {!file ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <MotionSafeIcon
              icon={UploadIcon}
              size={24}
              className="text-[var(--color-text-secondary)]"
            />
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {PHASE_LABEL[phase] ?? 'Click to upload'}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {accept.split(',').join(', ')}
            </span>
          </div>
        ) : (
          <div className="flex w-full items-center gap-3">
            <span
              className="rounded px-1.5 py-0.5 text-xs font-semibold uppercase"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-surface)',
              }}
            >
              {ext}
            </span>
            <span
              className="flex-1 truncate text-sm"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {file.name}
              {PHASE_LABEL[phase] ? ` — ${PHASE_LABEL[phase]}` : ''}
            </span>
            <button
              type="button"
              aria-label={`remove ${file.name}`}
              onClick={(e) => {
                e.preventDefault();
                void handleRemove();
              }}
              className="flex h-[44px] w-[44px] items-center justify-center rounded-md transition-opacity hover:opacity-70 focus:outline focus:outline-2 focus:outline-offset-2"
              style={{ outlineColor: 'var(--color-primary)' }}
            >
              <X className="h-4 w-4" style={{ color: 'var(--color-text-secondary)' }} />
            </button>
          </div>
        )}
      </label>

      <input
        id={inputId}
        type="file"
        aria-label={label}
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const selected = e.target.files?.[0];
          if (!selected) return;
          void handleFile(selected);
          e.target.value = '';
        }}
      />

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
