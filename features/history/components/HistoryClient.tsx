'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import type { LessonPlan } from '@/types';
import { BlurText } from '@/components/ui/effects/BlurText';
import { LessonPlanCard } from '@/features/lesson/components/LessonPlanCard';
import { useLessonActions } from '@/features/lesson/hooks/useLessonActions';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useT } from '@/providers/locale';
import { HistoryToolbar } from '@/features/history/components/HistoryToolbar';

const HISTORY_LESSON_SCROLL_KEY = 'freeperiod:history-lesson-scroll';

type LessonCard = Pick<LessonPlan, 'id' | 'title' | 'subject' | 'grade' | 'duration_minutes' | 'created_at'>;

function distinctSorted(values: (string | null | undefined)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))].sort();
}

function HistoryPageTitleBlock({ testId }: { testId: string }) {
  const t = useT();

  return (
    <div
      data-testid={testId}
      className="mb-6 flex shrink-0 flex-wrap items-center justify-between gap-3"
    >
      <BlurText
        as="h1"
        text={t('history.title')}
        className="font-display text-3xl font-bold text-text-primary"
      />
      <Button asChild>
        <Link href="/generate">{t('history.planLesson')}</Link>
      </Button>
    </div>
  );
}

export function HistoryClient() {
  const t = useT();
  const scrollerRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      sessionStorage.setItem(HISTORY_LESSON_SCROLL_KEY, String(el.scrollTop));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (initialLoading) return;
    const el = scrollerRef.current;
    if (!el) return;
    const saved = sessionStorage.getItem(HISTORY_LESSON_SCROLL_KEY);
    if (!saved) return;
    const top = Number.parseInt(saved, 10);
    if (!Number.isFinite(top)) return;
    requestAnimationFrame(() => {
      el.scrollTop = top;
    });
  }, [initialLoading]);

  const { handleDelete, handleRename } = useLessonActions(setLessons, {
    afterDelete: refreshFacets,
  });

  const hasActiveFilters = Boolean(
    debouncedSearch || subjectFilter || gradeFilter || curriculumFilter,
  );

  const toolbarProps = {
    search,
    onSearchChange: setSearch,
    subjectFilter,
    gradeFilter,
    curriculumFilter,
    onSubjectFilterChange: setSubjectFilter,
    onGradeFilterChange: setGradeFilter,
    onCurriculumFilterChange: setCurriculumFilter,
    allSubjects,
    allGrades,
    allCurricula,
  };

  const lessonGrid = initialLoading ? (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {lessons.map((lesson) => (
        <LessonPlanCard
          key={lesson.id}
          lesson={lesson}
          onDelete={handleDelete}
          onRename={handleRename}
        />
      ))}
    </div>
  );

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden">
      <div className="mx-auto w-full max-w-5xl shrink-0">
        <div data-testid="history-page-header" className="max-sm:hidden px-4 pt-8">
          <HistoryPageTitleBlock testId="history-page-title-desktop" />
        </div>
        <div
          data-testid="history-mobile-toolbar-row"
          className="shrink-0 px-4 py-3 sm:px-4 sm:py-0"
        >
          <HistoryToolbar {...toolbarProps} />
        </div>
      </div>

      <div
        ref={scrollerRef}
        data-testid="history-lesson-scroller"
        className="min-h-0 flex-1 overflow-y-auto"
      >
        <div className="mx-auto max-w-5xl px-0.5 pt-2 pb-8">
          <div className="px-3.5 sm:px-0">
            <div className="sm:hidden">
              <HistoryPageTitleBlock testId="history-page-title-mobile" />
            </div>
            {lessonGrid}
          </div>
        </div>
      </div>
    </div>
  );
}