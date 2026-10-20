'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { AnimatedDropdown } from '@/components/ui/animated-dropdown';
import { FieldError } from '@/components/ui/FieldError';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DocumentUploadZone } from '@/components/forms/DocumentUploadZone';
import { CurriculumAccuracyNotice } from '@/components/curriculum/CurriculumAccuracyNotice';
import { GenerationModePicker } from '@/features/generate/components/GenerationModePicker';
import { usePresetField } from '@/lib/forms/usePresetField';
import { formatDurationMinutes } from '@/lib/i18n/format';
import { LOCALE_LABELS } from '@/lib/i18n';
import { useLocale, useT } from '@/providers/locale';
import { SUBJECTS, SUBJECT_ITEMS } from '@/lib/utils/subjects';
import { getGradeItems } from '@/lib/utils/grades';
import { CURRICULA, CURRICULUM_ITEMS } from '@/lib/utils/curricula';
import { getCurriculumPack } from '@/lib/curriculum/packs';
import { FILLABLE_TEMPLATE_ACCEPT } from '@/lib/lesson/template-path';
import type { Plan } from '@/types';

const GENERATION_MODE_STORAGE_KEY = 'fp-generation-mode';

type GenerationMode = 'fast' | 'quality';

function isPaidPlan(plan: Plan): boolean {
  return plan === 'pro' || plan === 'pro_plus';
}

const DURATION_PRESETS = [30, 45, 60, 90, 120];
const CUSTOM_DURATION_MIN = 1;
const CUSTOM_DURATION_MAX = 300;

const CURRICULUM_DOC_ACCEPT = '.pdf,.docx,.xlsx,.jpg,.png';
const TEMPLATE_ACCEPT = FILLABLE_TEMPLATE_ACCEPT;

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
  userPlan?: Plan;
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
  generationMode: GenerationMode;
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
  const { locale } = useLocale();
  const t = useT();
  const subjectField = usePresetField(defaults?.subject, SUBJECTS as readonly string[]);
  const curriculumField = usePresetField(defaults?.curriculum, CURRICULA as readonly string[]);
  const packHelper = getCurriculumPack(curriculumField.value)?.uiHelperText;
  const [grade, setGrade] = useState(defaults?.grade ?? '');
  const [durationSelect, setDurationSelect] = useState('60');
  const [customDuration, setCustomDuration] = useState('');
  const [teacherPrompt, setTeacherPrompt] = useState('');
  const [curriculumDocPath, setCurriculumDocPath] = useState<string | null>(null);
  const [templatePath, setTemplatePath] = useState<string | null>(null);
  const [curriculumUploading, setCurriculumUploading] = useState(false);
  const [templateUploading, setTemplateUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [generationMode, setGenerationMode] = useState<GenerationMode>(() =>
    isPaidPlan(userPlan) ? 'quality' : 'fast',
  );

  const qualityUnlocked = isPaidPlan(userPlan);

  const durationItems = useMemo(
    () => [
      ...DURATION_PRESETS.map((d) => ({
        name: formatDurationMinutes(d, t),
        value: String(d),
      })),
      { name: t('generate.customDuration'), value: 'custom' },
    ],
    [t],
  );

  const gradeItems = useMemo(() => getGradeItems(t), [t]);

  useEffect(() => {
    if (!qualityUnlocked) {
      setGenerationMode('fast');
      return;
    }

    const stored = localStorage.getItem(GENERATION_MODE_STORAGE_KEY);
    if (stored === 'fast' || stored === 'quality') {
      setGenerationMode(stored);
    }
  }, [qualityUnlocked]);

  const handleGenerationModeChange = (mode: GenerationMode) => {
    if (!qualityUnlocked) return;
    setGenerationMode(mode);
    localStorage.setItem(GENERATION_MODE_STORAGE_KEY, mode);
  };

  const uploadsBusy = curriculumUploading || templateUploading;
  const busy = isGenerating || isSubmitting || uploadsBusy;

  const handleCurriculumComplete = useCallback((path: string) => {
    setCurriculumDocPath(path);
  }, []);
  const handleCurriculumRemove = useCallback(() => {
    setCurriculumDocPath(null);
  }, []);
  const handleTemplateComplete = useCallback((path: string) => {
    setTemplatePath(path);
  }, []);
  const handleTemplateRemove = useCallback(() => {
    setTemplatePath(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: FieldErrors = {};
    if (!subjectField.value.trim()) {
      nextErrors.subject = t('generate.errorSelectSubject');
    } else if (/[,;/]|\band\b/i.test(subjectField.value)) {
      nextErrors.subject = t('generate.errorOneSubject');
    }
    if (!grade.trim()) {
      nextErrors.grade = t('generate.errorSelectGrade');
    }

    let duration = Number.parseInt(durationSelect, 10);
    if (durationSelect === 'custom') {
      const custom = parseCustomDuration(customDuration);
      if (custom === null) {
        nextErrors.duration = t('generate.errorDurationRange', {
          min: String(CUSTOM_DURATION_MIN),
          max: String(CUSTOM_DURATION_MAX),
        });
      } else {
        duration = custom;
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    if (uploadsBusy) {
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
        generationMode: qualityUnlocked ? generationMode : 'fast',
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
      <h2 className="font-display text-2xl font-bold text-text-primary mb-2">{t('generate.heading')}</h2>
      <p className="text-sm text-text-secondary mb-6">
        {t('generate.planLanguageHint', { language: LOCALE_LABELS[locale] ?? LOCALE_LABELS.en })}{' '}
        <Link href="/settings" className="text-coral hover:underline">
          {t('nav.settings')}
        </Link>
      </p>
      <div className="mb-6">
        <CurriculumAccuracyNotice curriculum={curriculumField.value} />
      </div>

      <div className="space-y-5">
        {/* Subject */}
        <div>
          <label
            htmlFor="subject-select"
            className="mb-2 block text-sm font-body font-medium text-text-secondary"
          >
            {t('generate.subject')}
          </label>
          <AnimatedDropdown
            id="subject-select"
            text={t('generate.selectSubject')}
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
                label={t('generate.enterSubject')}
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
            <FieldError message={errors.subject} />
          )}
        </div>

        {/* Grade */}
        <div>
          <label
            htmlFor="grade-select"
            className="mb-2 block text-sm font-body font-medium text-text-secondary"
          >
            {t('generate.grade')}
          </label>
          <AnimatedDropdown
            id="grade-select"
            text={t('generate.selectGrade')}
            items={gradeItems}
            selectedValue={grade}
            onSelect={(item) => {
              setGrade(item.value ?? item.name);
              setErrors((prev) => ({ ...prev, grade: undefined }));
            }}
          />
          {errors.grade && <FieldError message={errors.grade} />}
        </div>

        {/* Curriculum */}
        <div>
          <label
            htmlFor="curriculum-select"
            className="mb-2 block text-sm font-body font-medium text-text-secondary"
          >
            {t('generate.curriculum')}
          </label>
          <AnimatedDropdown
            id="curriculum-select"
            text={t('generate.selectCurriculum')}
            items={CURRICULUM_ITEMS}
            selectedValue={curriculumField.select}
            onSelect={(item) => curriculumField.setSelect(item.value ?? item.name)}
          />
          {curriculumField.isCustom && (
            <div className="mt-2">
              <Input
                label={t('generate.enterCurriculum')}
                value={curriculumField.custom}
                onChange={(e) => curriculumField.setCustom(e.target.value)}
              />
            </div>
          )}
          {packHelper && (
            <p className="mt-2 text-sm text-text-secondary">{packHelper}</p>
          )}
        </div>

        {/* Duration */}
        <div>
          <label
            htmlFor="duration-select"
            className="mb-2 block text-sm font-body font-medium text-text-secondary"
          >
            {t('generate.duration')}
          </label>
          <AnimatedDropdown
            id="duration-select"
            text={t('generate.selectDuration')}
            items={durationItems}
            selectedValue={durationSelect}
            onSelect={(item) => {
              setDurationSelect(item.value ?? String(item.name));
              setErrors((prev) => ({ ...prev, duration: undefined }));
            }}
          />
          {durationSelect === 'custom' && (
            <div className="mt-2">
              <Input
                label={t('generate.customDurationInput')}
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
            <FieldError message={errors.duration} />
          )}
        </div>

        {/* Teacher Prompt */}
        <div>
          <label
            htmlFor="teacher-prompt"
            className="mb-2 block text-sm font-body font-medium text-text-secondary"
          >
            {t('generate.focusLabel')}
          </label>
          <textarea
            id="teacher-prompt"
            value={teacherPrompt}
            onChange={(e) => setTeacherPrompt(e.target.value)}
            placeholder={t('generate.focusPlaceholder')}
            className="w-full h-24 rounded-xl border border-border bg-background px-3 py-2 text-base font-body text-text-primary placeholder:text-text-secondary focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral resize-none"
          />
        </div>

        {/* Upload Zones */}
        <DocumentUploadZone
          accept={CURRICULUM_DOC_ACCEPT}
          uploadType="curriculum_doc"
          onUploadComplete={handleCurriculumComplete}
          onRemove={handleCurriculumRemove}
          onBusyChange={setCurriculumUploading}
        />
        <DocumentUploadZone
          accept={TEMPLATE_ACCEPT}
          uploadType="template"
          onUploadComplete={handleTemplateComplete}
          onRemove={handleTemplateRemove}
          onBusyChange={setTemplateUploading}
        />

        {/* Generation mode */}
        <div>
          <label
            htmlFor="generation-mode-picker"
            className="mb-2 block text-sm font-body font-medium text-text-secondary"
          >
            {t('generate.modeLabel')}
          </label>
          <GenerationModePicker
            id="generation-mode-picker"
            value={generationMode}
            onChange={handleGenerationModeChange}
            qualityUnlocked={qualityUnlocked}
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={!subjectField.value.trim() || busy}
          isLoading={busy}
          className="w-full mt-6"
        >
          {uploadsBusy && !isGenerating ? t('generate.waitingForUpload') : busy ? t('generate.generating') : (
            <>
              <Plus className="h-5 w-5 mr-2" />
              {t('generate.submit')}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
