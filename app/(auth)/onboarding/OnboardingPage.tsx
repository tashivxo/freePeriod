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
import { getGradeItems } from '@/lib/utils/grades';
import { CURRICULUM_ITEMS } from '@/lib/utils/curricula';
import { getCountryDropdownItems, normalizeCountryCode } from '@/lib/utils/countries';
import { XIcon } from '@/components/ui/icons/x';
import { useMotionSafeIconRef } from '@/hooks/useMotionSafeIconRef';
import { useT } from '@/providers/locale';

type FinishStatus = 'idle' | 'saving' | 'redirecting';

export function OnboardingPage() {
  const router = useRouter();
  const t = useT();
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
        setError(t('onboarding.mustBeSignedIn'));
        setIsSubmitting(false);
        setFinishStatus('idle');
        return;
      }

      const defaultSubject = selectedSubject || customSubject.trim();
      const countryCode = normalizeCountryCode(country);
      if (!countryCode) {
        setError(t('onboarding.selectACountry'));
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

      const profileFields = {
        name: displayName,
        default_subject: defaultSubject,
        default_grade: grade,
        default_curriculum: curriculumSelect === 'Custom' ? customCurriculum : curriculumSelect,
        country: countryCode,
        onboarding_complete: true,
      };

      const { data: updated, error: updateError } = await supabase
        .from('users')
        .update(profileFields)
        .eq('id', user.id)
        .select('id')
        .maybeSingle();

      if (updateError) {
        setError(updateError.message);
        setIsSubmitting(false);
        setFinishStatus('idle');
        return;
      }

      if (!updated) {
        const { error: insertError } = await supabase.from('users').insert({
          id: user.id,
          email: user.email ?? '',
          ...profileFields,
        });
        if (insertError) {
          setError(insertError.message);
          setIsSubmitting(false);
          setFinishStatus('idle');
          return;
        }
      }

      setFinishStatus('redirecting');
      redirectFallbackTimerRef.current = setTimeout(() => {
        setShowDashboardLink(true);
      }, 5000);

      router.push('/dashboard');
    } catch {
      setError(t('onboarding.somethingWentWrong'));
      setIsSubmitting(false);
      setFinishStatus('idle');
    }
  }, [selectedSubject, customSubject, grade, country, curriculumSelect, customCurriculum, router, t]);

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
            {t('onboarding.subtitle')}
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
  const t = useT();
  return (
    <div
      role="progressbar"
      aria-valuenow={step}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={t('onboarding.stepOf', { step: String(step), total: String(total) })}
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
  const t = useT();
  const hasSubject = Boolean(selectedSubject || customSubject.trim());

  return (
    <div>
      <h1 className="mb-2 text-center font-display text-2xl font-bold text-text-primary">
        {t('onboarding.whatDoYouTeach')}
      </h1>
      <p className="mb-6 text-center font-body text-sm text-text-secondary">
        {t('onboarding.pickSubjectHint')}
      </p>

      <div className="mb-4 flex flex-wrap justify-center gap-2" role="radiogroup" aria-label={t('onboarding.subjectAria')}>
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
        placeholder={t('onboarding.otherSubject')}
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
        {t('onboarding.next')}
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
  const t = useT();
  return (
    <div>
      <h1 className="mb-6 text-center font-display text-2xl font-bold text-text-primary">
        {t('onboarding.whatGrade')}
      </h1>

      <div className="mb-6">
        <label htmlFor="grade-select" className="mb-2 block text-sm font-medium text-text-secondary">
          {t('onboarding.gradeLevel')}
        </label>
        <AnimatedDropdown
          id="grade-select"
          text={t('onboarding.selectGrade')}
          items={getGradeItems(t)}
          selectedValue={grade}
          onSelect={(item) => onGradeChange(item.value ?? item.name)}
        />
      </div>

      {error && <StepError message={error} />}

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1">
          {t('onboarding.back')}
        </Button>
        <Button onClick={onNext} className="flex-1" disabled={!grade}>
          {t('onboarding.next')}
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
  const t = useT();
  return (
    <div>
      <h1
        id="onboarding-country-heading"
        className="mb-2 text-center font-display text-2xl font-bold text-text-primary"
      >
        {t('onboarding.whereDoYouTeach')}
      </h1>
      <p className="mb-6 text-center font-body text-sm text-text-secondary">
        {t('onboarding.changeInSettings')}
      </p>

      <div className="mb-6">
        <AnimatedDropdown
          id="country-select"
          text={t('onboarding.selectCountry')}
          items={getCountryDropdownItems({
            common: t('countries.common'),
            all: t('countries.all'),
          })}
          selectedValue={country || undefined}
          searchable
          searchPlaceholder={t('onboarding.selectCountry')}
          triggerAriaLabelledBy="onboarding-country-heading"
          onSelect={(item) => onCountryChange(item.value ?? '')}
        />
      </div>

      {error && <StepError message={error} />}

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1">
          {t('onboarding.back')}
        </Button>
        <Button onClick={onNext} className="flex-1" disabled={!country}>
          {t('onboarding.next')}
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
  const t = useT();
  const finishLabel =
    finishStatus === 'saving'
      ? t('onboarding.saving')
      : finishStatus === 'redirecting'
        ? t('onboarding.redirecting')
        : t('onboarding.finish');

  return (
    <div>
      <h1 className="mb-6 text-center font-display text-2xl font-bold text-text-primary">
        {t('onboarding.selectCurriculum')}
      </h1>

      <div className="mb-6">
        <label htmlFor="curriculum-select" className="mb-2 block text-sm font-medium text-text-secondary">
          {t('onboarding.curriculumLabel')}
        </label>
        <AnimatedDropdown
          id="curriculum-select"
          text={t('onboarding.selectCurriculum')}
          items={CURRICULUM_ITEMS}
          selectedValue={curriculumSelect}
          onSelect={(item) => onCurriculumSelectChange(item.value ?? item.name)}
        />
        {curriculumSelect === 'Custom' && (
          <div className="mt-3">
            <Input
              label={t('onboarding.enterCurriculum')}
              value={customCurriculum}
              onChange={(e) => onCustomCurriculumChange(e.target.value)}
            />
          </div>
        )}
      </div>

      {error && <StepError message={error} />}

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1" disabled={isSubmitting}>
          {t('onboarding.back')}
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
          {t('onboarding.redirectingToDashboard')}
        </p>
      )}

      {showDashboardLink && (
        <p className="mt-4 text-center text-sm text-text-secondary" role="status">
          {t('onboarding.takingAWhile')}{' '}
          <Link href="/dashboard" className="font-semibold text-coral hover:underline">
            {t('onboarding.goToDashboard')}
          </Link>
        </p>
      )}
    </div>
  );
}
