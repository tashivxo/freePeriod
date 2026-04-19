'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SUBJECTS } from '@/lib/utils/subjects';
import { AnimatedDropdown, type DropdownItem } from '@/components/ui/animated-dropdown';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { BlurText } from '@/components/BlurText';
import type { User } from '@/types/database';

const SUBJECT_ITEMS: DropdownItem[] = [
  ...(SUBJECTS as readonly string[]).map((s) => ({ name: s, value: s })),
  { name: 'Custom', value: 'Custom' },
];

export function SettingsClient({ user }: { user: User }) {
  const subjectsPreset = SUBJECTS as readonly string[];
  const initialSubjectIsPreset = user.default_subject ? subjectsPreset.includes(user.default_subject) : false;
  const [subjectSelect, setSubjectSelect] = useState<string>(
    initialSubjectIsPreset ? (user.default_subject ?? '') : (user.default_subject ? 'Custom' : '')
  );
  const [customSubject, setCustomSubject] = useState<string>(
    !initialSubjectIsPreset && user.default_subject ? user.default_subject : ''
  );
  const subject = subjectSelect === 'Custom' ? customSubject : subjectSelect;
  const [grade, setGrade] = useState(user.default_grade ?? '');
  const [curriculum, setCurriculum] = useState(user.default_curriculum ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = await createClient();
      const { error } = await supabase
        .from('users')
        .update({
          default_subject: subject || null,
          default_grade: grade || null,
          default_curriculum: curriculum || null,
        })
        .eq('id', user.id);

      if (error) throw error;
      alert('Settings saved!');
    } catch (err) {
      console.error(err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <BlurText
            as="h1"
            text="Settings"
            className="font-display text-2xl font-bold text-text-primary"
          />
          <ThemeToggle />
        </div>

        <div className="space-y-6">
          {/* Default Subject */}
          <div>
            <label
              htmlFor="default-subject"
              className="mb-2 block text-sm font-body font-medium text-text-secondary"
            >
              Default Subject
            </label>
            <AnimatedDropdown
              id="default-subject"
              text="Select subject"
              items={SUBJECT_ITEMS}
              selectedValue={subjectSelect}
              onSelect={(item) => setSubjectSelect(item.value ?? item.name)}
            />
            {subjectSelect === 'Custom' && (
              <div className="mt-3">
                <Input
                  label="Enter subject"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Default Grade */}
          <div>
            <label htmlFor="default-grade" className="mb-2 block text-sm font-body font-medium text-text-secondary">
              Default Grade / Year Group
            </label>
            <Input
              id="default-grade"
              label="Grade / Year Group"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="e.g., 10, Year 8"
            />
          </div>

          {/* Default Curriculum */}
          <div>
            <label htmlFor="default-curriculum" className="mb-2 block text-sm font-body font-medium text-text-secondary">
              Default Curriculum
            </label>
            <Input
              id="default-curriculum"
              label="Curriculum"
              value={curriculum}
              onChange={(e) => setCurriculum(e.target.value)}
              placeholder="e.g., IB, AP, GCSE"
            />
          </div>

          {/* Save Button */}
          <Button onClick={handleSave} disabled={saving} className="w-full mt-6">
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
