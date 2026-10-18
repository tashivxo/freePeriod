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
import { useT } from '@/providers/locale';

type LessonCard = Pick<LessonPlan, 'id' | 'title' | 'subject' | 'grade' | 'duration_minutes' | 'created_at'>;

export function HistoryClient() {
  const t = useT();
  const [lessons, setLessons] = useState<LessonCard[]>([]);
  const [allSubjects, setAllSubjects] = useState<string[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');

  useEffect(() => {
    document.title = t('history.documentTitle');
  }, [t]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const refreshSubjects = useCallback(async () => {
    const supabase = createClient();
    const { data: subjectRows } = await supabase
      .from('lesson_plans')
      .select('subject')
      .order('subject');
    setAllSubjects(
      [...new Set((subjectRows ?? []).map((row) => row.subject).filter(Boolean))].sort(),
    );
  }, []);

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

    const [{ data }] = await Promise.all([query, refreshSubjects()]);
    setLessons(data ?? []);
    setInitialLoading(false);
  }, [debouncedSearch, subjectFilter, refreshSubjects]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const handleDelete = useCallback(async (id: string) => {
    const supabase = createClient();
    await supabase.from('lesson_plans').delete().eq('id', id);
    setLessons((prev) => prev.filter((l) => l.id !== id));
    await refreshSubjects();
  }, [refreshSubjects]);

  const hasActiveFilters = Boolean(debouncedSearch || subjectFilter);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <BlurText
          as="h1"
          text={t('history.title')}
          className="font-display text-3xl font-bold text-text-primary"
        />
        <Button asChild>
          <Link href="/generate">{t('history.planLesson')}</Link>
        </Button>
      </div>

      {/* Filters stay under the h-14 nav while lesson cards scroll beneath. */}
      <div className="sticky top-14 z-30 -mx-4 mb-6 border-b border-border/50 bg-background/90 px-4 py-3 backdrop-blur-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 w-full flex-1">
            <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3">
              <Search className="size-4 text-text-secondary" aria-hidden />
            </span>
            <input
              type="text"
              placeholder={t('history.searchPlaceholder')}
              aria-label={t('history.searchAriaLabel')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-13 w-full rounded-xl border-2 border-border bg-surface py-0 ps-9 pe-3 text-base font-body text-text-primary placeholder:text-text-secondary hover:border-coral/60 focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20"
            />
          </div>
          {allSubjects.length > 1 && (
            <AnimatedDropdown
              text={t('history.allSubjects')}
              items={[
                { name: t('history.allSubjects'), value: '' } as DropdownItem,
                ...allSubjects.map((s) => ({ name: s, value: s } as DropdownItem)),
              ]}
              selectedValue={subjectFilter || undefined}
              onSelect={(item) => setSubjectFilter(item.value ?? '')}
              className="w-full min-w-0 sm:w-auto sm:min-w-[10rem] sm:flex-none"
            />
          )}
        </div>
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
            <p>{t('history.nothingFound')}</p>
          ) : (
            <>
              <p className="mb-4">{t('history.noLessons')}</p>
              <Button asChild>
                <Link href="/generate">{t('history.generateALesson')}</Link>
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
