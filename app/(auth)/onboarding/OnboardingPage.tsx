'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { AnimatedDropdown } from '@/components/ui/animated-dropdown';
import { Input } from '@/components/ui/Input';
import { SUBJECTS } from '@/lib/utils/subjects';
import { GRADE_ITEMS } from '@/lib/utils/grades';
import { CURRICULUM_ITEMS } from '@/lib/utils/curricula';

export function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [curriculumSelect, setCurriculumSelect] = useState('');
  const [customCurriculum, setCustomCurriculum] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const stepContainerRef = useRef<HTMLDivElement>(null);

  const animateStep = useCallback(async (direction: 'forward' | 'back') => {
    const container = stepContainerRef.current;
    if (!container) return;

    try {
      const { animate } = await import('animejs');
      const startX = direction === 'forward' ? 40 : -40;
      animate(container, {
        translateX: [startX, 0],
        opacity: [0, 1],
        duration: 300,
        easing: 'easeOutCubic',
      });
    } catch {
      // Animation library unavailable — continue silently
    }
  }, []);

  const toggleSubject = useCallback((subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject],
    );
  }, []);

  const handleNext = useCallback(async () => {
    setStep((prev) => prev + 1);
    await animateStep('forward');
  }, [animateStep]);

  const handleBack = useCallback(async () => {
    setStep((prev) => prev - 1);
    await animateStep('back');
  }, [animateStep]);

  const handleFinish = useCallback(async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('You must be signed in to complete onboarding.');
        setIsSubmitting(false);
        return;
      }

      const subjects = [...selectedSubjects];
      if (customSubject.trim()) {
        subjects.push(customSubject.trim());
      }

      const metaName = user.user_metadata?.name;
      const metaFullName = user.user_metadata?.full_name;
      const displayName =
        (typeof metaName === 'string' ? metaName : null) ??
        (typeof metaFullName === 'string' ? metaFullName : null) ??
        user.email?.split('@')[0] ??
        '';

      const { error: updateError } = await supabase
        .from('users')
        .upsert(
          {
            id: user.id,
            email: user.email ?? '',
            name: displayName,
            default_subject: subjects.join(', '),
            default_grade: grade,
            default_curriculum: curriculumSelect === 'Custom' ? customCurriculum : curriculumSelect,
            onboarding_complete: true,
          },
          { onConflict: 'id' },
        );

      if (updateError) {
        setError(updateError.message);
        setIsSubmitting(false);
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  }, [selectedSubjects, customSubject, grade, curriculumSelect, customCurriculum, router]);

  // Animate on mount
  useEffect(() => {
    animateStep('forward');
  }, [animateStep]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg">
        <p className="mb-6 text-center text-sm text-text-secondary">
          {step} / 3
        </p>

        <div ref={stepContainerRef}>
          {step === 1 && (
            <StepSubjects
              subjects={selectedSubjects}
              customSubject={customSubject}
              onToggle={toggleSubject}
              onCustomChange={setCustomSubject}
              onNext={handleNext}
            />
          )}

          {step === 2 && (
            <StepGrade
              grade={grade}
              onGradeChange={setGrade}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {step === 3 && (
            <StepCurriculum
              curriculumSelect={curriculumSelect}
              onCurriculumSelectChange={setCurriculumSelect}
              customCurriculum={customCurriculum}
              onCustomCurriculumChange={setCustomCurriculum}
              onBack={handleBack}
              onFinish={handleFinish}
              isSubmitting={isSubmitting}
            />
          )}
        </div>

        {error && (
          <p className="mt-4 text-center text-sm text-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function StepSubjects({
  subjects,
  customSubject,
  onToggle,
  onCustomChange,
  onNext,
}: {
  subjects: string[];
  customSubject: string;
  onToggle: (subject: string) => void;
  onCustomChange: (value: string) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <h1 className="mb-6 text-center font-display text-2xl font-bold text-text-primary">
        What do you teach?
      </h1>

      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {SUBJECTS.map((subject) => (
          <button
            key={subject}
            type="button"
            role="button"
            aria-pressed={subjects.includes(subject)}
            onClick={() => onToggle(subject)}
            className={`min-h-[44px] rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              subjects.includes(subject)
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-background text-text-primary hover:border-coral'
            }`}
          >
            {subject}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Other subject..."
        value={customSubject}
        onChange={(e) => onCustomChange(e.target.value)}
        className="mb-6 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20"
      />

      <Button
        onClick={onNext}
        className="w-full"
        disabled={subjects.length === 0 && !customSubject.trim()}
      >
        Next
      </Button>
    </div>
  );
}

function StepGrade({
  grade,
  onGradeChange,
  onNext,
  onBack,
}: {
  grade: string;
  onGradeChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <h1 className="mb-6 text-center font-display text-2xl font-bold text-text-primary">
        What grade level?
      </h1>

      <div className="mb-6">
        <label htmlFor="grade-select" className="mb-2 block text-sm font-medium text-text-secondary">
          Grade Level
        </label>
        <AnimatedDropdown
          id="grade-select"
          text="Select a grade..."
          items={GRADE_ITEMS}
          selectedValue={grade}
          onSelect={(item) => onGradeChange(item.value ?? item.name)}
        />
      </div>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1">
          Back
        </Button>
        <Button onClick={onNext} className="flex-1" disabled={!grade}>
          Next
        </Button>
      </div>
    </div>
  );
}

function StepCurriculum({
  curriculumSelect,
  onCurriculumSelectChange,
  customCurriculum,
  onCustomCurriculumChange,
  onBack,
  onFinish,
  isSubmitting,
}: {
  curriculumSelect: string;
  onCurriculumSelectChange: (value: string) => void;
  customCurriculum: string;
  onCustomCurriculumChange: (value: string) => void;
  onBack: () => void;
  onFinish: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div>
      <h1 className="mb-6 text-center font-display text-2xl font-bold text-text-primary">
        What curriculum?
      </h1>

      <div className="mb-6">
        <label htmlFor="curriculum-select" className="mb-2 block text-sm font-medium text-text-secondary">
          Curriculum
        </label>
        <AnimatedDropdown
          id="curriculum-select"
          text="Select a curriculum..."
          items={CURRICULUM_ITEMS}
          selectedValue={curriculumSelect}
          onSelect={(item) => onCurriculumSelectChange(item.value ?? item.name)}
        />
        {curriculumSelect === 'Custom' && (
          <div className="mt-3">
            <Input
              label="Enter curriculum"
              value={customCurriculum}
              onChange={(e) => onCustomCurriculumChange(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1">
          Back
        </Button>
        <Button
          onClick={onFinish}
          className="flex-1"
          isLoading={isSubmitting}
          disabled={!curriculumSelect || (curriculumSelect === 'Custom' && !customCurriculum.trim())}
        >
          Finish
        </Button>
      </div>
    </div>
  );
}
