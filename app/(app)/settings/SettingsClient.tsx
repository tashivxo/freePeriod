'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import type { User } from '@/types/database';

export function SettingsClient({ user }: { user: User }) {
  const [subject, setSubject] = useState(user.default_subject ?? '');
  const [grade, setGrade] = useState(user.default_grade ?? '');
  const [curriculum, setCurriculum] = useState(user.default_curriculum ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveDefaults = useCallback(async () => {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from('users')
      .update({
        default_subject: subject || null,
        default_grade: grade || null,
        default_curriculum: curriculum || null,
      })
      .eq('id', user.id);
    setSaving(false);
    setSaved(true);
  }, [subject, grade, curriculum, user.id]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(t);
  }, [saved]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-text-primary mb-8">
        Settings
      </h1>

      {/* Profile */}
      <section className="mb-8">
        <h2 className="font-display text-xl font-semibold text-text-primary mb-4">
          Profile
        </h2>
        <div className="rounded-xl border border-gray-100 bg-surface p-5 space-y-3">
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
        </div>
      </section>

      {/* Teaching defaults */}
      <section className="mb-8">
        <h2 className="font-display text-xl font-semibold text-text-primary mb-4">
          Teaching Defaults
        </h2>
        <div className="rounded-xl border border-gray-100 bg-surface p-5 space-y-4">
          <div>
            <label htmlFor="subject" className="block text-xs font-body text-text-secondary mb-1">
              Default Subject
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Mathematics"
              className="w-full rounded-lg border border-gray-200 bg-background px-3 py-2 text-sm font-body text-text-primary placeholder:text-text-secondary focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral"
            />
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
              className="w-full rounded-lg border border-gray-200 bg-background px-3 py-2 text-sm font-body text-text-primary placeholder:text-text-secondary focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral"
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
              className="w-full rounded-lg border border-gray-200 bg-background px-3 py-2 text-sm font-body text-text-primary placeholder:text-text-secondary focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="primary" size="md" isLoading={saving} onClick={handleSaveDefaults}>
              Save Defaults
            </Button>
            {saved && (
              <span className="text-sm font-body text-green-600">Saved!</span>
            )}
          </div>
        </div>
      </section>

      {/* Usage */}
      <section>
        <h2 className="font-display text-xl font-semibold text-text-primary mb-4">
          Usage
        </h2>
        <div className="rounded-xl border border-gray-100 bg-surface p-5">
          <p className="font-body text-text-primary">
            <span className="text-2xl font-display font-bold text-coral">{user.generation_count}</span>
            <span className="ml-2 text-text-secondary text-sm">lessons generated</span>
          </p>
        </div>
      </section>
    </div>
  );
}
