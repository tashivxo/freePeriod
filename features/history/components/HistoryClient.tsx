'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import type { LessonPlan } from '@/types';
import { BlurText } from '@/components/ui/effects/BlurText';
import { AnimatedDropdown, type DropdownItem } from '@/components/ui/animated-dropdown';
import { LessonPlanCard } from '@/features/lesson/components/LessonPlanCard';

type LessonCard = Pick<LessonPlan, 'id' | 'title' | 'subject' | 'grade' | 'duration_minutes' | 'created_at'>;

export function HistoryClient() {
  const [lessons, setLessons] = useState<LessonCard[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchLessons = useCallback(async () => {
    const supabase = createClient();
    let query = supabase
      .from('lesson_plans')
      .select('id, title, subject, grade, duration_minutes, created_at')
      .order('created_at', { ascending: false });

    if (subjectFilter) {
      query = query.eq('subject', subjectFilter);
    }
    if (debouncedSearch) {
      query = query.ilike('title', `%${debouncedSearch}%`);
    }

    const { data } = await query;
    const rows = data ?? [];
    setLessons(rows);
    if (!subjectFilter && !debouncedSearch) {
      setSubjectOptions([...new Set(rows.map((lesson) => lesson.subject))].sort());
    }
    setInitialLoading(false);
  }, [debouncedSearch, subjectFilter]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const handleDelete = useCallback(async (id: string) => {
    const supabase = createClient();
    await supabase.from('lesson_plans').delete().eq('id', id);
    setLessons((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const subjects = [
    ...new Set([
      ...subjectOptions,
      ...(subjectFilter ? [subjectFilter] : []),
    ]),
  ].sort();
  const hasActiveFilters = Boolean(debouncedSearch || subjectFilter);
  const showSubjectFilter = subjectOptions.length > 1 || Boolean(subjectFilter);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <BlurText as="h1" text="Lesson Plan History" className="font-display text-3xl font-bold text-text-primary mb-6" />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex h-13 min-w-[200px] flex-1 items-center rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-background-elevated)] focus-within:border-coral focus-within:ring-2 focus-within:ring-coral/20">
          <Search className="pointer-events-none ml-3 size-4 shrink-0 translate-y-px text-text-secondary" />
          <input
            type="text"
            placeholder="Search by title..."
            aria-label="Search lessons by title"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-full min-w-0 flex-1 border-0 bg-transparent py-0 pl-2.5 pr-3 text-base font-body text-text-primary placeholder:text-text-secondary focus:outline-none"
          />
        </div>
        {showSubjectFilter && (
          <AnimatedDropdown
            text="All subjects"
            items={[
              { name: 'All subjects', value: '' } as DropdownItem,
              ...subjects.map((s) => ({ name: s, value: s } as DropdownItem)),
            ]}
            selectedValue={subjectFilter || undefined}
            onSelect={(item) => setSubjectFilter(item.value ?? '')}
            className="min-w-[160px] flex-none w-auto"
          />
        )}
      </div>

      {/* Grid */}
      {initialLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 bg-surface rounded-xl" />
          ))}
        </div>
      ) : lessons.length === 0 ? (
        <div className="text-center font-body text-text-secondary py-12">
          {hasActiveFilters ? (
            <p>Nothing found, try a different search.</p>
          ) : (
            <>
              <p className="mb-4">No lessons yet.</p>
              <Button asChild>
                <Link href="/generate">Generate a lesson</Link>
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.map((lesson) => (
            <LessonPlanCard key={lesson.id} lesson={lesson} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
