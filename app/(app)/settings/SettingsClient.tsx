'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SUBJECTS, SUBJECT_ITEMS } from '@/lib/utils/subjects';
import { GRADE_ITEMS } from '@/lib/utils/grades';
import { CURRICULUM_ITEMS } from '@/lib/utils/curricula';
import { usePresetField } from '@/lib/forms/usePresetField';
import { AnimatedDropdown } from '@/components/ui/animated-dropdown';
import { Input } from '@/components/ui/Input';
import { Button, buttonVariants } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/branding/ThemeToggle';
import { Switch } from '@/components/ui/switch';
import { BlurText } from '@/components/ui/effects/BlurText';
import { useZenMode } from '@/providers/zen-mode';
import { useLocale, useT } from '@/providers/locale';
import { isLocale, LOCALE_LABELS, LOCALES, type Locale } from '@/lib/i18n';
import { LanguagesIcon } from '@/components/ui/icons/languages';
import { LeafIcon } from '@/components/ui/icons/leaf';
import { MotionSafeIcon } from '@/components/ui/icons/MotionSafeIcon';
import { cn } from '@/lib/utils';
import { ExternalLink, LogOut } from 'lucide-react';
import { XIcon } from '@/components/ui/icons/x';
import { useMotionSafeIconRef } from '@/hooks/useMotionSafeIconRef';
import type { User } from '@/types';

const CURRICULA_PRESETS = CURRICULUM_ITEMS.map((c) => c.value ?? c.name);

const LOCALE_ITEMS = LOCALES.map((code) => ({
  name: LOCALE_LABELS[code],
  value: code,
}));

type SaveStatus = {
  tone: 'success' | 'error';
  message: string;
};

type DefaultsSnapshot = {
  subject: string;
  grade: string;
  curriculum: string;
};

export type SettingsClientProps = {
  user: User;
  email: string;
  planLabel: string;
  usageLabel?: string;
  manageSubscriptionUrl?: string | null;
};

export function SettingsClient({
  user,
  email,
  planLabel,
  usageLabel,
  manageSubscriptionUrl = null,
}: SettingsClientProps) {
  const subjectField = usePresetField(user.default_subject, SUBJECTS as readonly string[]);
  const curriculumField = usePresetField(user.default_curriculum, CURRICULA_PRESETS);
  const [gradeSelect, setGradeSelect] = useState<string>(user.default_grade ?? '');
  const [savedDefaults, setSavedDefaults] = useState<DefaultsSnapshot>({
    subject: user.default_subject ?? '',
    grade: user.default_grade ?? '',
    curriculum: user.default_curriculum ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const { ref: deleteErrorIconRef, animationDisabled: deleteErrorIconMotionDisabled } =
    useMotionSafeIconRef();
  const { ref: saveErrorIconRef, animationDisabled: saveErrorIconMotionDisabled } =
    useMotionSafeIconRef();
  const router = useRouter();
  const { zenMode, setZenMode } = useZenMode();
  const { locale, setLocale } = useLocale();
  const t = useT();

  const isDirty =
    subjectField.value !== savedDefaults.subject ||
    gradeSelect !== savedDefaults.grade ||
    curriculumField.value !== savedDefaults.curriculum;

  useEffect(() => {
    if (user.preferred_locale && isLocale(user.preferred_locale)) {
      setLocale(user.preferred_locale);
    }
  }, [setLocale, user.preferred_locale]);

  useEffect(() => {
    if (!deleteError || deleteErrorIconMotionDisabled) return;
    deleteErrorIconRef.current?.startAnimation();
  }, [deleteError, deleteErrorIconMotionDisabled, deleteErrorIconRef]);

  useEffect(() => {
    if (saveStatus?.tone !== 'error' || saveErrorIconMotionDisabled) return;
    saveErrorIconRef.current?.startAnimation();
  }, [saveStatus, saveErrorIconMotionDisabled, saveErrorIconRef]);

  useEffect(() => {
    if (saveStatus?.tone !== 'success') return;
    const timer = window.setTimeout(() => setSaveStatus(null), 4000);
    return () => window.clearTimeout(timer);
  }, [saveStatus]);

  const handleLocaleChange = async (nextLocale: Locale) => {
    setLocale(nextLocale);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('users')
        .update({ preferred_locale: nextLocale })
        .eq('id', user.id);
      if (error) throw error;
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!isDirty) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      const supabase = await createClient();
      const nextDefaults: DefaultsSnapshot = {
        subject: subjectField.value,
        grade: gradeSelect,
        curriculum: curriculumField.value,
      };
      const { error } = await supabase
        .from('users')
        .update({
          default_subject: nextDefaults.subject || null,
          default_grade: nextDefaults.grade || null,
          default_curriculum: nextDefaults.curriculum || null,
        })
        .eq('id', user.id);

      if (error) throw error;
      setSavedDefaults(nextDefaults);
      setSaveStatus({ tone: 'success', message: t('settings.saved') });
    } catch (err) {
      console.error(err);
      setSaveStatus({ tone: 'error', message: t('settings.saveFailed') });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch('/api/user/delete', { method: 'POST' });
      const data = (await res.json()) as { error?: string; graceDays?: number };
      if (!res.ok) {
        setDeleteError(data.error ?? 'Failed to delete account');
        return;
      }
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/sign-in?deleted=1');
    } catch {
      setDeleteError('Something went wrong. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <BlurText
            as="h1"
            text={t('settings.title')}
            className="font-display text-2xl font-bold text-text-primary"
          />
          <ThemeToggle />
        </div>

        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-border bg-background p-4">
          <div className="flex min-w-0 items-start gap-3">
            <MotionSafeIcon icon={LeafIcon} size={20} className="mt-0.5 text-text-secondary" />
            <div className="min-w-0">
              <label
                htmlFor="zen-mode"
                className="block text-sm font-body font-medium text-text-primary"
              >
                {t('settings.zenMode')}
              </label>
              <p className="mt-1 text-sm font-body text-text-secondary">
                {t('settings.zenModeDescription')}
              </p>
            </div>
          </div>
          <Switch
            id="zen-mode"
            checked={zenMode}
            onCheckedChange={(checked) => setZenMode(!!checked)}
            className="data-checked:bg-coral shrink-0"
            aria-label={t('settings.zenMode')}
          />
        </div>

        <div className="mb-6 rounded-xl border border-border bg-background p-4">
          <div className="mb-3 flex items-start gap-3">
            <MotionSafeIcon icon={LanguagesIcon} size={20} className="mt-0.5 text-text-secondary" />
            <div className="min-w-0">
              <label
                htmlFor="preferred-locale"
                className="block text-sm font-body font-medium text-text-primary"
              >
                {t('settings.language')}
              </label>
              <p className="mt-1 text-sm font-body text-text-secondary">
                {t('settings.languageDescription')}
              </p>
            </div>
          </div>
          <AnimatedDropdown
            id="preferred-locale"
            text={LOCALE_LABELS[locale]}
            items={LOCALE_ITEMS}
            selectedValue={locale}
            triggerAriaLabel={t('settings.language')}
            onSelect={(item) => {
              const nextLocale = item.value ?? item.name;
              if (isLocale(nextLocale)) {
                void handleLocaleChange(nextLocale);
              }
            }}
          />
        </div>

        <div className="space-y-6">
          {/* Default Subject */}
          <div>
            <label
              htmlFor="default-subject"
              className="mb-2 block text-sm font-body font-medium text-text-secondary"
            >
              {t('settings.defaultSubject')}
            </label>
            <AnimatedDropdown
              id="default-subject"
              text={t('settings.selectSubject')}
              items={SUBJECT_ITEMS}
              selectedValue={subjectField.select}
              onSelect={(item) => subjectField.setSelect(item.value ?? item.name)}
            />
            {subjectField.isCustom && (
              <div className="mt-3">
                <Input
                  label={t('settings.enterSubject')}
                  value={subjectField.custom}
                  onChange={(e) => subjectField.setCustom(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Default Grade */}
          <div>
            <label htmlFor="default-grade" className="mb-2 block text-sm font-body font-medium text-text-secondary">
              {t('settings.defaultGrade')}
            </label>
            <AnimatedDropdown
              id="default-grade"
              text={t('settings.selectGrade')}
              items={GRADE_ITEMS}
              selectedValue={gradeSelect}
              onSelect={(item) => setGradeSelect(item.value ?? item.name)}
            />
          </div>

          {/* Default Curriculum */}
          <div>
            <label htmlFor="default-curriculum" className="mb-2 block text-sm font-body font-medium text-text-secondary">
              {t('settings.defaultCurriculum')}
            </label>
            <AnimatedDropdown
              id="default-curriculum"
              text={t('settings.selectCurriculum')}
              items={CURRICULUM_ITEMS}
              selectedValue={curriculumField.select}
              onSelect={(item) => curriculumField.setSelect(item.value ?? item.name)}
            />
            {curriculumField.isCustom && (
              <div className="mt-3">
                <Input
                  label={t('settings.enterCurriculum')}
                  value={curriculumField.custom}
                  onChange={(e) => curriculumField.setCustom(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={!isDirty || saving}
            isLoading={saving}
            className="w-full mt-6"
          >
            {saving ? t('settings.saving') : t('settings.save')}
          </Button>
          {saveStatus?.tone === 'success' && (
            <div
              role="status"
              className="mt-3 rounded-xl bg-success/10 p-3 text-center font-body text-sm text-success"
            >
              {saveStatus.message}
            </div>
          )}
          {saveStatus?.tone === 'error' && (
            <div
              role="alert"
              className="mt-3 flex gap-3 rounded-xl bg-error/10 p-3 text-error"
            >
              <XIcon
                ref={saveErrorIconRef}
                size={24}
                animationDisabled={saveErrorIconMotionDisabled}
                aria-hidden
                className="mt-0.5 shrink-0"
              />
              <p className="font-body text-sm text-error">{saveStatus.message}</p>
            </div>
          )}
        </div>
      </div>

      {/* Account */}
      <div className="mt-4 rounded-2xl border border-border bg-surface p-6 md:p-8">
        <h2 className="mb-4 font-display text-lg font-semibold text-text-primary">{t('settings.account')}</h2>
        <dl className="mb-4 space-y-3 rounded-xl border border-border bg-background p-4">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <dt className="text-sm font-body font-medium text-text-secondary">{t('settings.email')}</dt>
            <dd className="truncate text-sm font-body text-text-primary">{email}</dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <dt className="text-sm font-body font-medium text-text-secondary">{t('settings.plan')}</dt>
            <dd className="text-sm font-body text-text-primary">{planLabel}</dd>
          </div>
          {usageLabel && (
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
              <dt className="text-sm font-body font-medium text-text-secondary">{t('settings.usage')}</dt>
              <dd className="text-sm font-body text-text-primary">{usageLabel}</dd>
            </div>
          )}
        </dl>
        <div className="space-y-3">
          {manageSubscriptionUrl && (
            <a
              href={manageSubscriptionUrl}
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              {t('settings.manageSubscription')}
            </a>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              router.push('/sign-in');
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t('settings.logOut')}
          </Button>

          {!deleteOpen ? (
            <Button
              variant="outline"
              className="w-full border-error/30 text-error hover:bg-error/5"
              onClick={() => setDeleteOpen(true)}
            >
              {t('settings.deleteAccount')}
            </Button>
          ) : (
            <div className="rounded-xl border border-error/30 bg-error/5 p-4 space-y-3">
              <p className="text-sm font-body text-text-secondary">
                {t('settings.deleteConfirmDescription')}
              </p>
              <Input
                label={t('settings.deleteConfirmLabel')}
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
              />
              {deleteError && (
                <div role="alert" className="flex gap-3 rounded-xl bg-error/10 p-3 text-error">
                  <XIcon
                    ref={deleteErrorIconRef}
                    size={24}
                    animationDisabled={deleteErrorIconMotionDisabled}
                    aria-hidden
                    className="mt-0.5 shrink-0"
                  />
                  <p className="font-body text-sm text-error">{deleteError}</p>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-error hover:bg-error/90 text-white"
                  disabled={deleteConfirm !== 'DELETE' || deleting}
                  onClick={handleDeleteAccount}
                >
                  {deleting ? t('settings.deleting') : t('settings.confirmDeletion')}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={deleting}
                  onClick={() => {
                    setDeleteOpen(false);
                    setDeleteConfirm('');
                    setDeleteError('');
                  }}
                >
                  {t('settings.cancel')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legal */}
      <div className="mt-4 rounded-2xl border border-border bg-surface p-6 md:p-8">
        <h2 className="mb-2 font-display text-lg font-semibold text-text-primary">{t('settings.legal')}</h2>
        <p className="mb-4 text-sm font-body text-text-secondary">
          {t('settings.legalDescription')}
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-body">
          <Link
            href="/privacy"
            className="text-coral font-medium hover:underline"
          >
            {t('settings.privacyPolicy')}
          </Link>
          <Link
            href="/terms"
            className="text-coral font-medium hover:underline"
          >
            {t('settings.termsOfService')}
          </Link>
        </nav>
      </div>
    </div>
  );
}
