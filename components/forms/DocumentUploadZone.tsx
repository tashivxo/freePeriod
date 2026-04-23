'use client';

import { useEffect, useId } from 'react';
import { X, Upload } from 'lucide-react';
import { useFileUpload } from '@/lib/hooks/useFileUpload';
import { cn } from '@/lib/utils';
import type { UploadType } from '@/types/database';

interface DocumentUploadZoneProps {
  label: string;
  accept: string;
  uploadType: UploadType;
  onUploadComplete: (storagePath: string) => void;
  onRemove: () => void;
}

const SECTION_HEADINGS: Record<UploadType, string> = {
  curriculum_doc: 'Curriculum Document',
  template: 'Lesson Plan Template',
};

export function DocumentUploadZone({
  label,
  accept,
  uploadType,
  onUploadComplete,
  onRemove,
}: DocumentUploadZoneProps) {
  const inputId = useId();
  const sectionHeading = SECTION_HEADINGS[uploadType];

  const { file, storagePath, isUploading, error, handleFile, removeFile } = useFileUpload({
    uploadType,
  });

  // Notify parent when storagePath is set after a successful upload
  useEffect(() => {
    if (storagePath) {
      onUploadComplete(storagePath);
    }
  }, [storagePath, onUploadComplete]);

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
            <Upload
              className="h-6 w-6"
              style={{ color: 'var(--color-text-secondary)' }}
              aria-hidden="true"
            />
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {isUploading ? 'Uploading…' : 'Click or drag to upload'}
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
        }}
      />

      {error && (
        <p className="text-xs" style={{ color: 'var(--color-error)' }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
