'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { SUBJECTS } from '@/lib/utils/subjects';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { User } from '@/types/database';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { BlurText } from '@/components/BlurText';

export function SettingsClient({ user }: { user: User }) {
  const subjectsPreset = SUBJECTS as readonly string[];
  const initialSubjectIsPreset = user.default_subject ? subjectsPreset.includes(user.default_subject) : false;
  const [subjectSelect, setSubjectSelect] = useState<string>(
    initialSubjectIsPreset ? (user.default_subject ?? '') : (user.default_subject ? 'Other' : '')
  );
  const [customSubject, setCustomSubject] = useState<string>(
    !initialSubjectIsPreset && user.default_subject ? user.default_subject : ''
  );
  const subject = subjectSelect === 'Other' ? customSubject : subjectSelect;
  const [grade, setGrade] = useState(user.default_grade ?? '');
  const [curriculum, setCurriculum] = useState(user.default_curriculum ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSaveDefaults = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from('users')
      .update({
        default_subject: subject || null,
        default_grade: grade || null,
        default_curriculum: curriculum || null,
      })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      setSaveError('Failed to save defaults. Please try again.');
    } else {
      setSaved(true);
    }
  }, [subject, grade, curriculum, user.id]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(t);
  }, [saved]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <BlurText as="h1" text="Settings" className="font-display text-3xl font-bold text-text-primary mb-8" />

      {/* Profile */}
      <section className="mb-8">
        <h2 className="font-display text-xl font-semibold text-text-primary mb-4">
          Profile
        </h2>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-body text-text-secondary mb-1">Name</label>
            <p className="font-body text-text-primary">{user.name}</p>
          </div>
          <div>
            <label className="block text-xs font-body text-text-secondary mb-1">Email</label>
            <p className="font-body text-text-primary">{user.email}</p>
          </div>
          <div>
            <label className="block text-xs font-body text-text-secondary mb-1">Plan</label>
            <span className="inline-block rounded-full bg-coral/10 px-3 py-0.5 text-xs font-body font-medium text-coral capitalize">
              {user.plan}
            </span>
          </div>
          </CardContent>
        </Card>
      </section>

      {/* Teaching defaults */}
      <section className="mb-8">
        <h2 className="font-display text-xl font-semibold text-text-primary mb-4">
          Teaching Defaults
        </h2>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5 space-y-4">
          <div>
            <label htmlFor="subject-select" className="block text-xs font-body text-text-secondary mb-1">
              Default Subject
            </label>
            <select
              id="subject-select"
              value={subjectSelect}
              onChange={(e) => setSubjectSelect(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-body text-text-primary focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral"
            >
              <option value="">Select subject</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value="Other">Other</option>
            </select>
            {subjectSelect === 'Other' && (
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Enter subject"
                className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-body text-text-primary placeholder:text-text-secondary focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral"
              />
            )}
          </div>
          <div>
            <label htmlFor="grade" className="block text-xs font-body text-text-secondary mb-1">
              Default Grade / Year
            </label>
            <input
              id="grade"
              type="text"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="e.g. Year 9"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-body text-text-primary placeholder:text-text-secondary focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral"
            />
          </div>
          <div>
            <label htmlFor="curriculum" className="block text-xs font-body text-text-secondary mb-1">
              Default Curriculum
            </label>
            <input
              id="curriculum"
              type="text"
              value={curriculum}
              onChange={(e) => setCurriculum(e.target.value)}
              placeholder="e.g. UK National Curriculum"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-body text-text-primary placeholder:text-text-secondary focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" isLoading={saving} onClick={handleSaveDefaults}>
              Save Defaults
            </Button>
            {saved && (
              <span className="text-sm font-body text-green-600">Saved!</span>
            )}
            {saveError && (
              <span className="text-sm font-body text-error">{saveError}</span>
            )}
          </div>
          </CardContent>
        </Card>
      </section>

      {/* Usage */}
      <section>
        <h2 className="font-display text-xl font-semibold text-text-primary mb-4">
          Usage
        </h2>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5">
          <p className="font-body text-text-primary">
            <span className="text-2xl font-display font-bold text-coral">{user.generation_count}</span>
            <span className="ml-2 text-text-secondary text-sm">lessons generated</span>
          </p>
          </CardContent>
        </Card>
      </section>

      {/* Appearance */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-text-primary mb-4">
          Appearance
        </h2>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-sm font-medium text-text-primary">Theme</p>
                <p className="font-body text-xs text-text-secondary mt-0.5">Choose light or dark mode</p>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
