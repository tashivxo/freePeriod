'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { AnimatedDropdown } from '@/components/ui/animated-dropdown';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/ui/Logo';
import { SUBJECTS } from '@/lib/utils/subjects';
import { GRADE_ITEMS } from '@/lib/utils/grades';
import { CURRICULUM_ITEMS } from '@/lib/utils/curricula';

type FinishStatus = 'idle' | 'saving' | 'redirecting';

export function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [curriculumSelect, setCurriculumSelect] = useState('');
  const [customCurriculum, setCustomCurriculum] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finishStatus, setFinishStatus] = useState<FinishStatus>('idle');
  const [showDashboardLink, setShowDashboardLink] = useState(false);
  const [error, setError] = useState('');
  const stepContainerRef = useRef<HTMLDivElement>(null);
  const redirectFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [prefersReduced, setPrefersReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    return () => {
      if (redirectFallbackTimerRef.current) {
        clearTimeout(redirectFallbackTimerRef.current);
      }
    };
  }, []);

  const animateStep = useCallback(async (direction: 'forward' | 'back') => {
    const container = stepContainerRef.current;
    if (!container) return;

    if (prefersReduced) {
      container.style.opacity = '1';
      container.style.transform = 'translateX(0)';
      return;
    }

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
  }, [prefersReduced]);

  const toggleSubject = useCallback((subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject],
    );
  }, []);

  const handleNext = useCallback(async () => {
    setError('');
    setStep((prev) => prev + 1);
    await animateStep('forward');
  }, [animateStep]);

  const handleBack = useCallback(async () => {
    setError('');
    setStep((prev) => prev - 1);
    await animateStep('back');
  }, [animateStep]);

  const handleFinish = useCallback(async () => {
    setIsSubmitting(true);
    setFinishStatus('saving');
    setShowDashboardLink(false);
    setError('');

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('You must be signed in to complete onboarding.');
        setIsSubmitting(false);
        setFinishStatus('idle');
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
        setFinishStatus('idle');
        return;
      }

      setFinishStatus('redirecting');
      redirectFallbackTimerRef.current = setTimeout(() => {
        setShowDashboardLink(true);
      }, 5000);

      router.push('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
      setIsSubmitting(false);
      setFinishStatus('idle');
    }
  }, [selectedSubjects, customSubject, grade, curriculumSelect, customCurriculum, router]);

  // Animate on mount
  useEffect(() => {
    animateStep('forward');
  }, [animateStep]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background/80 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link href="/" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/40">
            <Logo size="lg" />
          </Link>
          <p className="font-body text-sm leading-relaxed text-text-secondary">
            Set up your teaching profile
          </p>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-6">
            <OnboardingProgress step={step} />

            <div ref={stepContainerRef}>
              {step === 1 && (
                <StepSubjects
                  subjects={selectedSubjects}
                  customSubject={customSubject}
                  error={error}
                  onToggle={toggleSubject}
                  onCustomChange={setCustomSubject}
                  onNext={handleNext}
                />
              )}

              {step === 2 && (
                <StepGrade
                  grade={grade}
                  error={error}
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
                  error={error}
                  onBack={handleBack}
                  onFinish={handleFinish}
                  isSubmitting={isSubmitting}
                  finishStatus={finishStatus}
                  showDashboardLink={showDashboardLink}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OnboardingProgress({ step, total = 3 }: { step: number; total?: number }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={step}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Step ${step} of ${total}`}
      className="mb-6 flex gap-2"
    >
      {Array.from({ length: total }, (_, index) => (
        <div
          key={index}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            index < step ? 'bg-primary' : 'bg-border'
          }`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function StepError({ message }: { message: string }) {
  return (
    <div role="alert" className="mb-4 rounded-xl bg-error/10 p-3 text-center text-sm text-error">
      {message}
    </div>
  );
}

function StepSubjects({
  subjects,
  customSubject,
  error,
  onToggle,
  onCustomChange,
  onNext,
}: {
  subjects: string[];
  customSubject: string;
  error: string;
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
        className="mb-6 w-full rounded-xl border border-border bg-background px-4 py-3 text-base focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20"
      />

      {error && <StepError message={error} />}

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
  error,
  onGradeChange,
  onNext,
  onBack,
}: {
  grade: string;
  error: string;
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

      {error && <StepError message={error} />}

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
  error,
  onBack,
  onFinish,
  isSubmitting,
  finishStatus,
  showDashboardLink,
}: {
  curriculumSelect: string;
  onCurriculumSelectChange: (value: string) => void;
  customCurriculum: string;
  onCustomCurriculumChange: (value: string) => void;
  error: string;
  onBack: () => void;
  onFinish: () => void;
  isSubmitting: boolean;
  finishStatus: FinishStatus;
  showDashboardLink: boolean;
}) {
  const finishLabel =
    finishStatus === 'saving'
      ? 'Saving…'
      : finishStatus === 'redirecting'
        ? 'Redirecting…'
        : 'Finish';

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

      {error && <StepError message={error} />}

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1" disabled={isSubmitting}>
          Back
        </Button>
        <Button
          onClick={onFinish}
          className="flex-1"
          isLoading={isSubmitting}
          disabled={
            !curriculumSelect ||
            (curriculumSelect === 'Custom' && !customCurriculum.trim()) ||
            isSubmitting
          }
        >
          {finishLabel}
        </Button>
      </div>

      {finishStatus === 'redirecting' && (
        <p className="mt-4 text-center text-sm text-text-secondary" role="status" aria-live="polite">
          Redirecting to your dashboard…
        </p>
      )}

      {showDashboardLink && (
        <p className="mt-4 text-center text-sm text-text-secondary" role="status">
          Taking a while?{' '}
          <Link href="/dashboard" className="font-semibold text-coral hover:underline">
            Go to dashboard
          </Link>
        </p>
      )}
    </div>
  );
}
