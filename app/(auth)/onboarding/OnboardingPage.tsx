'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { ChipRadio } from '@/components/forms/ChipRadio';
import { AnimatedDropdown } from '@/components/ui/animated-dropdown';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/ui/branding/Logo';
import { SUBJECTS } from '@/lib/utils/subjects';
import { GRADE_ITEMS } from '@/lib/utils/grades';
import { CURRICULUM_ITEMS } from '@/lib/utils/curricula';
import {
  COMMON_COUNTRY_ITEMS,
  COUNTRY_ITEMS,
  normalizeCountryCode,
} from '@/lib/utils/countries';
import { XIcon } from '@/components/ui/icons/x';
import { useMotionSafeIconRef } from '@/hooks/useMotionSafeIconRef';

type FinishStatus = 'idle' | 'saving' | 'redirecting';

export function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [country, setCountry] = useState('');
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

  const selectSubject = useCallback((subject: string) => {
    setCustomSubject('');
    setSelectedSubject((prev) => (prev === subject ? '' : subject));
  }, []);

  const handleCustomSubjectChange = useCallback((value: string) => {
    setSelectedSubject('');
    setCustomSubject(value);
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

      const defaultSubject = selectedSubject || customSubject.trim();
      const countryCode = normalizeCountryCode(country);
      if (!countryCode) {
        setError('Select a country.');
        setIsSubmitting(false);
        setFinishStatus('idle');
        return;
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
            default_subject: defaultSubject,
            default_grade: grade,
            default_curriculum: curriculumSelect === 'Custom' ? customCurriculum : curriculumSelect,
            country: countryCode,
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
  }, [selectedSubject, customSubject, grade, country, curriculumSelect, customCurriculum, router]);

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
                  selectedSubject={selectedSubject}
                  customSubject={customSubject}
                  error={error}
                  onSelect={selectSubject}
                  onCustomChange={handleCustomSubjectChange}
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
                <StepCountry
                  country={country}
                  error={error}
                  onCountryChange={setCountry}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}

              {step === 4 && (
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

function OnboardingProgress({ step, total = 4 }: { step: number; total?: number }) {
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
  const { ref: errorIconRef, animationDisabled: errorIconMotionDisabled } =
    useMotionSafeIconRef();

  useEffect(() => {
    if (!message || errorIconMotionDisabled) return;
    errorIconRef.current?.startAnimation();
  }, [message, errorIconMotionDisabled, errorIconRef]);

  return (
    <div role="alert" className="mb-4 flex items-start gap-3 rounded-xl bg-error/10 p-3 text-error">
      <XIcon
        ref={errorIconRef}
        size={20}
        animationDisabled={errorIconMotionDisabled}
        aria-hidden
        className="mt-0.5 shrink-0"
      />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function StepSubjects({
  selectedSubject,
  customSubject,
  error,
  onSelect,
  onCustomChange,
  onNext,
}: {
  selectedSubject: string;
  customSubject: string;
  error: string;
  onSelect: (subject: string) => void;
  onCustomChange: (value: string) => void;
  onNext: () => void;
}) {
  const hasSubject = Boolean(selectedSubject || customSubject.trim());

  return (
    <div>
      <h1 className="mb-2 text-center font-display text-2xl font-bold text-text-primary">
        What do you teach?
      </h1>
      <p className="mb-6 text-center font-body text-sm text-text-secondary">
        Pick one subject, you can change this anytime in settings.
      </p>

      <div className="mb-4 flex flex-wrap justify-center gap-2" role="radiogroup" aria-label="Subject">
        {SUBJECTS.map((subject) => (
          <ChipRadio
            key={subject}
            checked={selectedSubject === subject}
            onSelect={() => onSelect(subject)}
          >
            {subject}
          </ChipRadio>
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
        disabled={!hasSubject}
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
        What grade do you teach?
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

function StepCountry({
  country,
  error,
  onCountryChange,
  onNext,
  onBack,
}: {
  country: string;
  error: string;
  onCountryChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <h1
        id="onboarding-country-heading"
        className="mb-2 text-center font-display text-2xl font-bold text-text-primary"
      >
        Where do you teach?
      </h1>
      <p className="mb-6 text-center font-body text-sm text-text-secondary">
        You can change this in Settings.
      </p>

      <div className="mb-6">
        <select
          id="country-select"
          aria-labelledby="onboarding-country-heading"
          value={country}
          onChange={(event) => onCountryChange(event.target.value)}
          className="h-13 w-full rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-background-elevated)] px-4 font-body text-base text-text-primary transition-colors duration-150 hover:border-coral/60 focus:border-coral focus:ring-2 focus:ring-coral/20 focus:outline-none"
        >
          <option value="">Select your country</option>
          <optgroup label="Common">
            {COMMON_COUNTRY_ITEMS.map((item) => (
              <option key={`common-${item.value}`} value={item.value}>
                {item.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="All countries">
            {COUNTRY_ITEMS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.name}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {error && <StepError message={error} />}

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1">
          Back
        </Button>
        <Button onClick={onNext} className="flex-1" disabled={!country}>
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
