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
import { useLessonActions } from '@/features/lesson/hooks/useLessonActions';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useT } from '@/providers/locale';
import { formatGradeLabel } from '@/lib/utils/grades';

type LessonCard = Pick<LessonPlan, 'id' | 'title' | 'subject' | 'grade' | 'duration_minutes' | 'created_at'>;

function distinctSorted(values: (string | null | undefined)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))].sort();
}

export function HistoryClient() {
  const t = useT();
  const [lessons, setLessons] = useState<LessonCard[]>([]);
  const [allSubjects, setAllSubjects] = useState<string[]>([]);
  const [allGrades, setAllGrades] = useState<string[]>([]);
  const [allCurricula, setAllCurricula] = useState<string[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [curriculumFilter, setCurriculumFilter] = useState('');

  useDocumentTitle(t('history.documentTitle'));

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const refreshFacets = useCallback(async () => {
    const supabase = createClient();
    const { data: facetRows } = await supabase
      .from('lesson_plans')
      .select('subject, grade, curriculum')
      .order('subject');
    const rows = facetRows ?? [];
    setAllSubjects(distinctSorted(rows.map((row) => row.subject)));
    setAllGrades(distinctSorted(rows.map((row) => row.grade)));
    setAllCurricula(distinctSorted(rows.map((row) => row.curriculum)));
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
    if (gradeFilter) {
      query = query.eq('grade', gradeFilter);
    }
    if (curriculumFilter) {
      query = query.eq('curriculum', curriculumFilter);
    }
    if (debouncedSearch) {
      query = query.ilike('title', `%${debouncedSearch}%`);
    }

    const { data } = await query;
    setLessons(data ?? []);
    setInitialLoading(false);
  }, [curriculumFilter, debouncedSearch, gradeFilter, subjectFilter]);

  useEffect(() => {
    void refreshFacets();
  }, [refreshFacets]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const { handleDelete, handleRename } = useLessonActions(setLessons, {
    afterDelete: refreshFacets,
  });

  const hasActiveFilters = Boolean(
    debouncedSearch || subjectFilter || gradeFilter || curriculumFilter,
  );

  const filterDropdownClass = 'w-full min-w-0 lg:w-auto lg:min-w-[9rem]';

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

      <div className="mb-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:grid-cols-none lg:items-center lg:gap-3">
            <div className="relative min-w-0 w-full flex-1 sm:col-span-2 lg:max-w-sm">
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
                items={allSubjects.map((s) => ({ name: s, value: s } as DropdownItem))}
                selectedValue={subjectFilter || undefined}
                onSelect={(item) => setSubjectFilter(item.value ?? '')}
                clearable
                onClear={() => setSubjectFilter('')}
                clearAriaLabel={t('history.clearSubjectFilter')}
                className={filterDropdownClass}
              />
            )}
            {allGrades.length > 1 && (
              <AnimatedDropdown
                text={t('history.allGrades')}
                items={allGrades.map((g) => ({
                  name: formatGradeLabel(g, t),
                  value: g,
                }))}
                selectedValue={gradeFilter || undefined}
                onSelect={(item) => setGradeFilter(item.value ?? '')}
                clearable
                onClear={() => setGradeFilter('')}
                clearAriaLabel={t('history.clearGradeFilter')}
                className={filterDropdownClass}
              />
            )}
            {allCurricula.length > 1 && (
              <AnimatedDropdown
                text={t('history.allCurricula')}
                items={allCurricula.map((c) => ({ name: c, value: c } as DropdownItem))}
                selectedValue={curriculumFilter || undefined}
                onSelect={(item) => setCurriculumFilter(item.value ?? '')}
                clearable
                onClear={() => setCurriculumFilter('')}
                clearAriaLabel={t('history.clearCurriculumFilter')}
                className={filterDropdownClass}
              />
            )}
        </div>
      </div>

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
            <LessonPlanCard
              key={lesson.id}
              lesson={lesson}
              onDelete={handleDelete}
              onRename={handleRename}
            />
          ))}
        </div>
      )}
    </div>
  );
}