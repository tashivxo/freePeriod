'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SUBJECTS = [
  'Maths',
  'English',
  'Science',
  'History',
  'Geography',
  'Art',
  'Music',
  'PE',
  'ICT',
  'Languages',
] as const;

const GRADES = [
  'Pre-K',
  'K',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
] as const;

const CURRICULUM_SUGGESTIONS = [
  'CAPS',
  'UK National',
  'IB',
  'Common Core',
  'Australian',
  'UAE MOE',
] as const;

export function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [curriculum, setCurriculum] = useState('');
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

      const { error: updateError } = await supabase
        .from('users')
        .update({
          default_subject: subjects.join(', '),
          default_grade: grade,
          default_curriculum: curriculum,
          onboarding_complete: true,
        })
        .eq('id', user.id);

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
  }, [selectedSubjects, customSubject, grade, curriculum, router]);

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
              curriculum={curriculum}
              onCurriculumChange={setCurriculum}
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
        <Select value={grade} onValueChange={onGradeChange}>
          <SelectTrigger
            id="grade-select"
            className="min-h-[44px] w-full rounded-xl border-2 border-text-secondary/30 bg-surface pl-4 text-sm focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20"
          >
            <SelectValue placeholder="Select a grade..." />
          </SelectTrigger>
          <SelectContent>
            {GRADES.map((g) => (
              <SelectItem key={g} value={g}>
                {g === 'K' ? 'Kindergarten' : g === 'Pre-K' ? 'Pre-K' : `Grade ${g}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
  curriculum,
  onCurriculumChange,
  onBack,
  onFinish,
  isSubmitting,
}: {
  curriculum: string;
  onCurriculumChange: (value: string) => void;
  onBack: () => void;
  onFinish: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div>
      <h1 className="mb-6 text-center font-display text-2xl font-bold text-text-primary">
        What curriculum?
      </h1>

      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {CURRICULUM_SUGGESTIONS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onCurriculumChange(c)}
            className={`min-h-[44px] rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              curriculum === c
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-background text-text-primary hover:border-coral'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <label htmlFor="curriculum-input" className="mb-2 block text-sm font-medium text-text-secondary">
          Curriculum
        </label>
        <input
          id="curriculum-input"
          type="text"
          value={curriculum}
          onChange={(e) => onCurriculumChange(e.target.value)}
          placeholder="Or type your curriculum..."
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20"
        />
      </div>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1">
          Back
        </Button>
        <Button
          onClick={onFinish}
          className="flex-1"
          isLoading={isSubmitting}
          disabled={!curriculum.trim()}
        >
          Finish
        </Button>
      </div>
    </div>
  );
}
