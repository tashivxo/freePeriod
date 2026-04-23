import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { AnimatedDropdown, type DropdownItem } from '@/components/ui/animated-dropdown';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DocumentUploadZone } from '@/components/forms/DocumentUploadZone';
import { SUBJECTS } from '@/lib/utils/subjects';
import { GRADE_ITEMS } from '@/lib/utils/grades';
import { CURRICULA, CURRICULUM_ITEMS } from '@/lib/utils/curricula';

const DURATION_PRESETS = [30, 45, 60, 90, 120];

const SUBJECT_ITEMS: DropdownItem[] = [
  ...(SUBJECTS as readonly string[]).map((s) => ({ name: s, value: s })),
  { name: 'Custom', value: 'Custom' },
];

const DURATION_ITEMS: DropdownItem[] = [
  ...DURATION_PRESETS.map((d) => ({ name: `${d} min`, value: String(d) })),
  { name: 'Custom', value: 'custom' },
];

const MODEL_ITEMS: DropdownItem[] = [
  { name: 'Claude Sonnet (balanced)', value: 'claude-sonnet-4-6' },
];

const CURRICULUM_DOC_ACCEPT = '.pdf,.docx,.xlsx,.jpg,.png';
const TEMPLATE_ACCEPT = '.pdf,.docx,.xlsx';

export interface GenerateFormProps {
  defaults?: {
    subject?: string;
    grade?: string;
    curriculum?: string;
  };
  userPlan?: 'free' | 'pro';
  onSubmit?: (data: GenerateFormData) => void;
}

export interface GenerateFormData {
  subject: string;
  grade: string;
  curriculum: string;
  duration: number;
  teacherPrompt: string;
  modelPreference?: 'claude-sonnet-4-6';
  curriculumDocPath: string | null;
  templatePath: string | null;
}

export function GenerateForm({ defaults, userPlan = 'free', onSubmit }: GenerateFormProps) {
  const subjectsPreset = SUBJECTS as readonly string[];
  const defaultIsPreset = defaults?.subject ? subjectsPreset.includes(defaults.subject) : false;
  const [subjectSelect, setSubjectSelect] = useState<string>(
    defaultIsPreset ? (defaults?.subject ?? '') : (defaults?.subject ? 'Custom' : '')
  );
  const [customSubject, setCustomSubject] = useState<string>(
    !defaultIsPreset && defaults?.subject ? defaults.subject : ''
  );
  const subject = subjectSelect === 'Custom' ? customSubject : subjectSelect;
  const [grade, setGrade] = useState(defaults?.grade ?? '');
  const defaultIsPresetCurriculum = defaults?.curriculum
    ? (CURRICULA as readonly string[]).includes(defaults.curriculum)
    : false;
  const [curriculumSelect, setCurriculumSelect] = useState<string>(
    defaultIsPresetCurriculum ? (defaults?.curriculum ?? '') : (defaults?.curriculum ? 'Custom' : '')
  );
  const [customCurriculum, setCustomCurriculum] = useState<string>(
    !defaultIsPresetCurriculum && defaults?.curriculum ? defaults.curriculum : ''
  );
  const curriculum = curriculumSelect === 'Custom' ? customCurriculum : curriculumSelect;
  const [durationSelect, setDurationSelect] = useState('60');
  const [customDuration, setCustomDuration] = useState('');
  const [teacherPrompt, setTeacherPrompt] = useState('');
  const [modelPreference, setModelPreference] = useState<'claude-sonnet-4-6'>('claude-sonnet-4-6');
  const [curriculumDocPath, setCurriculumDocPath] = useState<string | null>(null);
  const [templatePath, setTemplatePath] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !grade.trim()) {
      alert('Please select subject and grade');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData: GenerateFormData = {
        subject,
        grade,
        curriculum,
        duration: parseInt(durationSelect === 'custom' ? customDuration : durationSelect, 10),
        teacherPrompt,
        modelPreference,
        curriculumDocPath,
        templatePath,
      };

      if (onSubmit) {
        onSubmit(formData);
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
            selectedValue={subjectSelect}
            onSelect={(item) => setSubjectSelect(item.value ?? item.name)}
          />
          {subjectSelect === 'Custom' && (
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
            className="mb-2 block text-sm font-body font-medium text-text-secondary"
          >
            Grade
          </label>
          <AnimatedDropdown
            id="grade-select"
            text="Select grade"
            items={GRADE_ITEMS}
            selectedValue={grade}
            onSelect={(item) => setGrade(item.value ?? item.name)}
          />
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
            selectedValue={curriculumSelect}
            onSelect={(item) => setCurriculumSelect(item.value ?? item.name)}
          />
          {curriculumSelect === 'Custom' && (
            <div className="mt-2">
              <Input
                label="Enter curriculum"
                value={customCurriculum}
                onChange={(e) => setCustomCurriculum(e.target.value)}
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
            onSelect={(item) => setDurationSelect(item.value ?? String(item.name))}
          />
          {durationSelect === 'custom' && (
            <div className="mt-2">
              <Input
                label="How long is the lesson? (minutes)"
                type="number"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
              />
            </div>
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
            className="w-full h-24 rounded-xl border border-border bg-background px-3 py-2 text-sm font-body text-text-primary placeholder:text-text-secondary focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral resize-none"
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

        {/* Model Selection (Pro only) */}
        {userPlan === 'pro' && (
          <div>
            <label htmlFor="model-select" className="mb-2 block text-sm font-body font-medium text-text-secondary">
              AI Model
            </label>
            <AnimatedDropdown
              id="model-select"
              text="Select model"
              items={MODEL_ITEMS}
              selectedValue={modelPreference}
              onSelect={(item) =>
                setModelPreference(item.value as 'claude-sonnet-4-6')
              }
            />
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={!subject.trim() || isSubmitting}
          className="w-full mt-6"
        >
          {isSubmitting ? 'Generating...' : (
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
