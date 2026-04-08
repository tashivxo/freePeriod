'use client';

import { useState, useCallback, useRef, type ChangeEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SUBJECTS } from '@/lib/utils/subjects';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BlurText } from '@/components/BlurText';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  modelPreference?: 'claude-opus-4-6' | 'claude-sonnet-4-6' | 'claude-haiku-4-5';
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
  userPlan?: 'free' | 'pro';
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

export function GenerateForm({ defaults, userPlan = 'free', onSubmit }: GenerateFormProps) {
  const subjectsPreset = SUBJECTS as readonly string[];
  const defaultIsPreset = defaults?.subject ? subjectsPreset.includes(defaults.subject) : false;
  const [subjectSelect, setSubjectSelect] = useState<string>(
    defaultIsPreset ? (defaults?.subject ?? '') : (defaults?.subject ? 'Other' : '')
  );
  const [customSubject, setCustomSubject] = useState<string>(
    !defaultIsPreset && defaults?.subject ? defaults.subject : ''
  );
  const subject = subjectSelect === 'Other' ? customSubject : subjectSelect;
  const [grade, setGrade] = useState(defaults?.grade ?? '');
  const [curriculum, setCurriculum] = useState(defaults?.curriculum ?? '');
  const [durationSelect, setDurationSelect] = useState('60');
  const [customDuration, setCustomDuration] = useState('');
  const [teacherPrompt, setTeacherPrompt] = useState('');
  const [modelPreference, setModelPreference] = useState<'claude-opus-4-6' | 'claude-sonnet-4-6' | 'claude-haiku-4-5'>('claude-opus-4-6');

  const [curriculumDoc, setCurriculumDoc] = useState<UploadedFile | null>(null);
  const [template, setTemplate] = useState<UploadedFile | null>(null);
  const [curriculumDocLoading, setCurriculumDocLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);

  const curriculumInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);

  const isCustomDuration = durationSelect === 'custom';
  const duration = isCustomDuration
    ? parseInt(customDuration, 10) || 0
    : parseInt(durationSelect, 10);

  const canSubmit = subject.trim().length > 0 && !curriculumDocLoading && !templateLoading;

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

      // Insert upload record into DB so the generate API can look it up
      const { data: uploadRecord } = await supabase
        .from('uploads')
        .insert({
          user_id: user.id,
          lesson_id: null,
          type: (type === 'curriculum' ? 'curriculum_doc' : 'template') as 'curriculum_doc' | 'template',
          file_name: file.name,
          storage_path: storagePath,
          parsed_content: null,
        })
        .select('id')
        .single();

      // Await parsing so parsed_content is ready before the user hits Generate
      if (uploadRecord?.id) {
        await fetch('/api/parse-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storagePath, uploadId: uploadRecord.id }),
        });
      }

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
      setCurriculumDocLoading(true);
      const uploaded = await uploadFile(file, 'curriculum');
      setCurriculumDocLoading(false);
      if (uploaded) setCurriculumDoc(uploaded);
    },
    [uploadFile],
  );

  const handleTemplateChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setTemplateLoading(true);
      const uploaded = await uploadFile(file, 'template');
      setTemplateLoading(false);
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
        modelPreference: userPlan === 'pro' ? modelPreference : undefined,
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
      modelPreference,
      userPlan,
    ],
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <BlurText as="h1" text="Generate a Lesson" className="mb-8 text-center font-display text-3xl font-bold text-text-primary" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Subject */}
        <div>
          <label
            htmlFor="subject-select"
            className="mb-1 block text-sm font-body font-medium text-text-secondary"
          >
            Subject
          </label>
          <Select value={subjectSelect} onValueChange={setSubjectSelect}>
            <SelectTrigger
              id="subject-select"
              className="h-13 w-full rounded-xl border-2 border-text-secondary/30 bg-surface pl-4 font-body text-base text-text-primary transition-colors duration-150 focus:border-coral focus:ring-2 focus:ring-coral/20 focus:outline-none"
            >
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {SUBJECTS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          {subjectSelect === 'Other' && (
            <div className="mt-2">
              <Input
                label="Enter subject"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Grade */}
        <div>
          <label
            htmlFor="grade-select"
            className="mb-1 block text-sm font-body font-medium text-text-secondary"
          >
            Grade
          </label>
          <Select value={grade} onValueChange={setGrade}>
            <SelectTrigger
              id="grade-select"
              className="h-13 w-full rounded-xl border-2 border-text-secondary/30 bg-surface pl-4 font-body text-base text-text-primary transition-colors duration-150 focus:border-coral focus:ring-2 focus:ring-coral/20 focus:outline-none"
            >
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent>
              {GRADES.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Select value={durationSelect} onValueChange={setDurationSelect}>
            <SelectTrigger
              id="duration-select"
              className="h-13 w-full rounded-xl border-2 border-text-secondary/30 bg-surface pl-4 font-body text-base text-text-primary transition-colors duration-150 focus:border-coral focus:ring-2 focus:ring-coral/20 focus:outline-none"
            >
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              {DURATION_PRESETS.map((d) => (
                <SelectItem key={d} value={String(d)}>{d} min</SelectItem>
              ))}
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          {isCustomDuration && (
            <div className="mt-2">
              <label
                htmlFor="custom-duration"
                className="mb-1 block text-sm font-body font-medium text-text-secondary"
              >
                How long is the lesson? (minutes)
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

        {/* AI Model selector (pro only) */}
        {userPlan === 'pro' && (
          <div>
            <label
              htmlFor="model-select"
              className="mb-1 block text-sm font-body font-medium text-text-secondary"
            >
              AI Model
            </label>
            <select
              id="model-select"
              value={modelPreference}
              onChange={(e) =>
                setModelPreference(
                  e.target.value as 'claude-opus-4-6' | 'claude-sonnet-4-6' | 'claude-haiku-4-5',
                )
              }
              className="h-13 w-full rounded-xl border-2 border-text-secondary/30 bg-surface px-4 font-body text-base text-text-primary transition-colors duration-150 focus:border-coral focus:ring-2 focus:ring-coral/20 focus:outline-none"
            >
              <option value="claude-opus-4-6">Claude Opus (most capable)</option>
              <option value="claude-sonnet-4-6">Claude Sonnet (balanced)</option>
              <option value="claude-haiku-4-5">Claude Haiku (fastest)</option>
            </select>
          </div>
        )}

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
            isLoading={curriculumDocLoading}
          />

          <UploadZone
            title="Lesson Plan Template"
            accept={TEMPLATE_ACCEPT}
            ariaLabel="Upload lesson plan template"
            file={template}
            inputRef={templateInputRef}
            onChange={handleTemplateChange}
            onRemove={() => removeFile('template')}
            isLoading={templateLoading}
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full"
          disabled={!canSubmit}
        >
          Generate lesson plan
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
  isLoading = false,
}: {
  title: string;
  accept: string;
  ariaLabel: string;
  file: UploadedFile | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  isLoading?: boolean;
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

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-1">
          <svg className="animate-spin h-4 w-4 text-coral" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm font-body text-text-secondary">Processing…</span>
        </div>
      ) : (
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
      )}

      {!isLoading && file && (
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
