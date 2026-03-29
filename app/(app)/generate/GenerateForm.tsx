'use client';

import { useState, useCallback, useRef, type ChangeEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const GRADES = [
  'Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
] as const;

const DURATION_PRESETS = [30, 45, 60, 90, 120] as const;

const CURRICULUM_DOC_ACCEPT = '.pdf,.docx,.xlsx,.jpg,.png';
const TEMPLATE_ACCEPT = '.pdf,.docx,.xlsx';

export type GenerateFormData = {
  subject: string;
  grade: string;
  curriculum: string;
  duration: number;
  teacherPrompt: string;
  curriculumDocPath: string | null;
  templatePath: string | null;
};

type UploadedFile = {
  name: string;
  typeBadge: string;
  storagePath: string;
};

type GenerateFormProps = {
  defaults?: {
    subject: string;
    grade: string;
    curriculum: string;
  };
  onSubmit: (data: GenerateFormData) => void;
};

function getTypeBadge(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    pdf: 'PDF',
    docx: 'DOCX',
    xlsx: 'XLSX',
    jpg: 'JPG',
    jpeg: 'JPG',
    png: 'PNG',
  };
  return map[ext] ?? ext.toUpperCase();
}

export function GenerateForm({ defaults, onSubmit }: GenerateFormProps) {
  const [subject, setSubject] = useState(defaults?.subject ?? '');
  const [grade, setGrade] = useState(defaults?.grade ?? '');
  const [curriculum, setCurriculum] = useState(defaults?.curriculum ?? '');
  const [durationSelect, setDurationSelect] = useState('60');
  const [customDuration, setCustomDuration] = useState('');
  const [teacherPrompt, setTeacherPrompt] = useState('');

  const [curriculumDoc, setCurriculumDoc] = useState<UploadedFile | null>(null);
  const [template, setTemplate] = useState<UploadedFile | null>(null);

  const curriculumInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);

  const isCustomDuration = durationSelect === 'custom';
  const duration = isCustomDuration
    ? parseInt(customDuration, 10) || 0
    : parseInt(durationSelect, 10);

  const canSubmit = subject.trim().length > 0;

  const uploadFile = useCallback(
    async (file: File, type: 'curriculum' | 'template') => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${user.id}/${type}/${timestamp}-${safeName}`;

      const { error } = await supabase.storage
        .from('uploads')
        .upload(storagePath, file);

      if (error) return null;

      return {
        name: file.name,
        typeBadge: getTypeBadge(file.name),
        storagePath,
      };
    },
    [],
  );

  const handleCurriculumDocChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const uploaded = await uploadFile(file, 'curriculum');
      if (uploaded) setCurriculumDoc(uploaded);
    },
    [uploadFile],
  );

  const handleTemplateChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const uploaded = await uploadFile(file, 'template');
      if (uploaded) setTemplate(uploaded);
    },
    [uploadFile],
  );

  const removeFile = useCallback(
    async (type: 'curriculum' | 'template') => {
      const fileInfo = type === 'curriculum' ? curriculumDoc : template;
      if (!fileInfo) return;

      const supabase = createClient();
      await supabase.storage.from('uploads').remove([fileInfo.storagePath]);

      if (type === 'curriculum') {
        setCurriculumDoc(null);
        if (curriculumInputRef.current) curriculumInputRef.current.value = '';
      } else {
        setTemplate(null);
        if (templateInputRef.current) templateInputRef.current.value = '';
      }
    },
    [curriculumDoc, template],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit) return;

      onSubmit({
        subject: subject.trim(),
        grade,
        curriculum: curriculum.trim(),
        duration,
        teacherPrompt: teacherPrompt.trim(),
        curriculumDocPath: curriculumDoc?.storagePath ?? null,
        templatePath: template?.storagePath ?? null,
      });
    },
    [
      canSubmit,
      subject,
      grade,
      curriculum,
      duration,
      teacherPrompt,
      curriculumDoc,
      template,
      onSubmit,
    ],
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-8 text-center font-display text-3xl font-bold text-text-primary">
        Generate a Lesson
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Subject */}
        <Input
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        {/* Grade */}
        <div>
          <label
            htmlFor="grade-select"
            className="mb-1 block text-sm font-body font-medium text-text-secondary"
          >
            Grade
          </label>
          <select
            id="grade-select"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="h-13 w-full rounded-xl border-2 border-text-secondary/30 bg-surface px-4 font-body text-base text-text-primary transition-colors duration-150 focus:border-coral focus:ring-2 focus:ring-coral/20 focus:outline-none"
          >
            <option value="">Select grade</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Curriculum */}
        <Input
          label="Curriculum"
          value={curriculum}
          onChange={(e) => setCurriculum(e.target.value)}
        />

        {/* Duration */}
        <div>
          <label
            htmlFor="duration-select"
            className="mb-1 block text-sm font-body font-medium text-text-secondary"
          >
            Duration
          </label>
          <select
            id="duration-select"
            value={durationSelect}
            onChange={(e) => setDurationSelect(e.target.value)}
            className="h-13 w-full rounded-xl border-2 border-text-secondary/30 bg-surface px-4 font-body text-base text-text-primary transition-colors duration-150 focus:border-coral focus:ring-2 focus:ring-coral/20 focus:outline-none"
          >
            {DURATION_PRESETS.map((d) => (
              <option key={d} value={String(d)}>
                {d} min
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>

          {isCustomDuration && (
            <div className="mt-2">
              <label
                htmlFor="custom-duration"
                className="mb-1 block text-sm font-body font-medium text-text-secondary"
              >
                Custom duration (minutes)
              </label>
              <input
                id="custom-duration"
                type="number"
                min={1}
                max={480}
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                className="h-13 w-full rounded-xl border-2 border-text-secondary/30 bg-surface px-4 font-body text-base text-text-primary transition-colors duration-150 focus:border-coral focus:ring-2 focus:ring-coral/20 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Teacher prompt */}
        <div>
          <label
            htmlFor="teacher-prompt"
            className="mb-1 block text-sm font-body font-medium text-text-secondary"
          >
            Any specific focus or requirements?
          </label>
          <textarea
            id="teacher-prompt"
            value={teacherPrompt}
            onChange={(e) => setTeacherPrompt(e.target.value)}
            rows={3}
            className="w-full rounded-xl border-2 border-text-secondary/30 bg-surface px-4 py-3 font-body text-base text-text-primary transition-colors duration-150 focus:border-coral focus:ring-2 focus:ring-coral/20 focus:outline-none resize-none"
          />
        </div>

        {/* File upload zones */}
        <div className="grid gap-4 sm:grid-cols-2">
          <UploadZone
            title="Curriculum Document"
            accept={CURRICULUM_DOC_ACCEPT}
            ariaLabel="Upload curriculum document"
            file={curriculumDoc}
            inputRef={curriculumInputRef}
            onChange={handleCurriculumDocChange}
            onRemove={() => removeFile('curriculum')}
          />

          <UploadZone
            title="School Template"
            accept={TEMPLATE_ACCEPT}
            ariaLabel="Upload school template"
            file={template}
            inputRef={templateInputRef}
            onChange={handleTemplateChange}
            onRemove={() => removeFile('template')}
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          fullWidth
          disabled={!canSubmit}
        >
          Generate
        </Button>
      </form>
    </div>
  );
}

// --- Upload zone sub-component ---

function UploadZone({
  title,
  accept,
  ariaLabel,
  file,
  inputRef,
  onChange,
  onRemove,
}: {
  title: string;
  accept: string;
  ariaLabel: string;
  file: UploadedFile | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border-2 border-dashed border-text-secondary/30 p-4 text-center transition-colors hover:border-coral/50">
      <p className="mb-2 text-sm font-body font-medium text-text-primary">
        {title}
      </p>
      <p className="mb-3 text-xs text-text-secondary">
        {accept
          .split(',')
          .map((ext) => ext.replace('.', '').toUpperCase())
          .join(', ')}
      </p>

      <label className="cursor-pointer">
        <span className="sr-only">{ariaLabel}</span>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          aria-label={ariaLabel}
          onChange={onChange}
          className="sr-only"
        />
        <span className="inline-block rounded-lg bg-coral/10 px-3 py-1.5 text-sm font-body font-medium text-coral transition-colors hover:bg-coral/20">
          Browse files
        </span>
      </label>

      {file && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="rounded bg-mustard/20 px-1.5 py-0.5 text-xs font-bold text-mustard">
            {file.typeBadge}
          </span>
          <span className="max-w-[140px] truncate text-sm text-text-primary">
            {file.name}
          </span>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${file.name}`}
            className="ml-1 rounded-full p-0.5 text-text-secondary transition-colors hover:bg-error/10 hover:text-error"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
