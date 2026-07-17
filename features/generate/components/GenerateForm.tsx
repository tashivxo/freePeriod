import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { AnimatedDropdown } from '@/components/ui/animated-dropdown';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DocumentUploadZone } from '@/components/forms/DocumentUploadZone';
import { usePresetField } from '@/lib/forms/usePresetField';
import { SUBJECTS, SUBJECT_ITEMS } from '@/lib/utils/subjects';
import { GRADE_ITEMS } from '@/lib/utils/grades';
import { CURRICULA, CURRICULUM_ITEMS } from '@/lib/utils/curricula';

const DURATION_PRESETS = [30, 45, 60, 90, 120];
const CUSTOM_DURATION_MIN = 1;
const CUSTOM_DURATION_MAX = 300;

const DURATION_ITEMS = [
  ...DURATION_PRESETS.map((d) => ({ name: `${d} min`, value: String(d) })),
  { name: 'Custom', value: 'custom' },
];

const CURRICULUM_DOC_ACCEPT = '.pdf,.docx,.xlsx,.jpg,.png';
const TEMPLATE_ACCEPT = '.pdf,.docx,.xlsx';

type FieldErrors = {
  subject?: string;
  grade?: string;
  duration?: string;
};

export interface GenerateFormProps {
  defaults?: {
    subject?: string;
    grade?: string;
    curriculum?: string;
  };
  userPlan?: 'free' | 'pro';
  onSubmit?: (data: GenerateFormData) => void | Promise<void>;
  /** Parent-owned busy flag (overlay lifecycle). Prefer over local submit flicker. */
  isGenerating?: boolean;
}

export interface GenerateFormData {
  subject: string;
  grade: string;
  curriculum: string;
  duration: number;
  teacherPrompt: string;
  curriculumDocPath: string | null;
  templatePath: string | null;
}

function parseCustomDuration(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed)) return null;
  if (parsed < CUSTOM_DURATION_MIN || parsed > CUSTOM_DURATION_MAX) return null;
  return parsed;
}

export function GenerateForm({
  defaults,
  userPlan = 'free',
  onSubmit,
  isGenerating = false,
}: GenerateFormProps) {
  const subjectField = usePresetField(defaults?.subject, SUBJECTS as readonly string[]);
  const curriculumField = usePresetField(defaults?.curriculum, CURRICULA as readonly string[]);
  const [grade, setGrade] = useState(defaults?.grade ?? '');
  const [durationSelect, setDurationSelect] = useState('60');
  const [customDuration, setCustomDuration] = useState('');
  const [teacherPrompt, setTeacherPrompt] = useState('');
  const [curriculumDocPath, setCurriculumDocPath] = useState<string | null>(null);
  const [templatePath, setTemplatePath] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const busy = isGenerating || isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: FieldErrors = {};
    if (!subjectField.value.trim()) {
      nextErrors.subject = 'Please select a subject';
    }
    if (!grade.trim()) {
      nextErrors.grade = 'Please select a grade';
    }

    let duration = Number.parseInt(durationSelect, 10);
    if (durationSelect === 'custom') {
      const custom = parseCustomDuration(customDuration);
      if (custom === null) {
        nextErrors.duration = `Enter a duration between ${CUSTOM_DURATION_MIN} and ${CUSTOM_DURATION_MAX} minutes`;
      } else {
        duration = custom;
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const formData: GenerateFormData = {
        subject: subjectField.value,
        grade,
        curriculum: curriculumField.value,
        duration,
        teacherPrompt,
        curriculumDocPath,
        templatePath,
      };

      if (onSubmit) {
        await onSubmit(formData);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-3xl mx-auto rounded-2xl border border-border bg-surface/50 backdrop-blur p-6 md:p-8"
    >
      <h2 className="font-display text-2xl font-bold text-text-primary mb-6">Generate a Lesson</h2>

      <div className="space-y-5">
        {/* Subject */}
        <div>
          <label
            htmlFor="subject-select"
            className="mb-2 block text-sm font-body font-medium text-text-secondary"
          >
            Subject
          </label>
          <AnimatedDropdown
            id="subject-select"
            text="Select subject"
            items={SUBJECT_ITEMS}
            selectedValue={subjectField.select}
            onSelect={(item) => {
              subjectField.setSelect(item.value ?? item.name);
              setErrors((prev) => ({ ...prev, subject: undefined }));
            }}
          />
          {subjectField.isCustom && (
            <div className="mt-2">
              <Input
                label="Enter subject"
                value={subjectField.custom}
                onChange={(e) => {
                  subjectField.setCustom(e.target.value);
                  setErrors((prev) => ({ ...prev, subject: undefined }));
                }}
                error={errors.subject}
              />
            </div>
          )}
          {!subjectField.isCustom && errors.subject && (
            <p className="mt-1 text-sm text-error" role="alert">
              {errors.subject}
            </p>
          )}
        </div>

        {/* Grade */}
        <div>
          <label
            htmlFor="grade-select"
            className="mb-2 block text-sm font-body font-medium text-text-secondary"
          >
            Grade
          </label>
          <AnimatedDropdown
            id="grade-select"
            text="Select grade"
            items={GRADE_ITEMS}
            selectedValue={grade}
            onSelect={(item) => {
              setGrade(item.value ?? item.name);
              setErrors((prev) => ({ ...prev, grade: undefined }));
            }}
          />
          {errors.grade && (
            <p className="mt-1 text-sm text-error" role="alert">
              {errors.grade}
            </p>
          )}
        </div>

        {/* Curriculum */}
        <div>
          <label
            htmlFor="curriculum-select"
            className="mb-2 block text-sm font-body font-medium text-text-secondary"
          >
            Curriculum
          </label>
          <AnimatedDropdown
            id="curriculum-select"
            text="Select curriculum (optional)"
            items={CURRICULUM_ITEMS}
            selectedValue={curriculumField.select}
            onSelect={(item) => curriculumField.setSelect(item.value ?? item.name)}
          />
          {curriculumField.isCustom && (
            <div className="mt-2">
              <Input
                label="Enter curriculum"
                value={curriculumField.custom}
                onChange={(e) => curriculumField.setCustom(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Duration */}
        <div>
          <label
            htmlFor="duration-select"
            className="mb-2 block text-sm font-body font-medium text-text-secondary"
          >
            Duration
          </label>
          <AnimatedDropdown
            id="duration-select"
            text="Select duration"
            items={DURATION_ITEMS}
            selectedValue={durationSelect}
            onSelect={(item) => {
              setDurationSelect(item.value ?? String(item.name));
              setErrors((prev) => ({ ...prev, duration: undefined }));
            }}
          />
          {durationSelect === 'custom' && (
            <div className="mt-2">
              <Input
                label="How long is the lesson? (minutes)"
                type="number"
                min={CUSTOM_DURATION_MIN}
                max={CUSTOM_DURATION_MAX}
                value={customDuration}
                onChange={(e) => {
                  setCustomDuration(e.target.value);
                  setErrors((prev) => ({ ...prev, duration: undefined }));
                }}
                error={errors.duration}
              />
            </div>
          )}
          {durationSelect !== 'custom' && errors.duration && (
            <p className="mt-1 text-sm text-error" role="alert">
              {errors.duration}
            </p>
          )}
        </div>

        {/* Teacher Prompt */}
        <div>
          <label
            htmlFor="teacher-prompt"
            className="mb-2 block text-sm font-body font-medium text-text-secondary"
          >
            Any specific focus or requirements? (optional)
          </label>
          <textarea
            id="teacher-prompt"
            value={teacherPrompt}
            onChange={(e) => setTeacherPrompt(e.target.value)}
            placeholder="E.g. Include hands-on activities, emphasize critical thinking..."
            className="w-full h-24 rounded-xl border border-border bg-background px-3 py-2 text-base font-body text-text-primary placeholder:text-text-secondary focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral resize-none"
          />
        </div>

        {/* Upload Zones */}
        <DocumentUploadZone
          label="Upload curriculum document"
          accept={CURRICULUM_DOC_ACCEPT}
          uploadType="curriculum_doc"
          onUploadComplete={(p) => setCurriculumDocPath(p)}
          onRemove={() => setCurriculumDocPath(null)}
        />
        <DocumentUploadZone
          label="Upload lesson plan template"
          accept={TEMPLATE_ACCEPT}
          uploadType="template"
          onUploadComplete={(p) => setTemplatePath(p)}
          onRemove={() => setTemplatePath(null)}
        />

        {/* Submit */}
        <Button
          type="submit"
          disabled={!subjectField.value.trim() || busy}
          isLoading={busy}
          className="w-full mt-6"
        >
          {busy ? 'Generating...' : (
            <>
              <Plus className="h-5 w-5 mr-2" />
              Generate Lesson Plan
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
