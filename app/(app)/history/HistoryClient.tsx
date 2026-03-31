'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, BookOpen, Clock, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/card';
import type { LessonPlan } from '@/types/database';

type LessonCard = Pick<LessonPlan, 'id' | 'title' | 'subject' | 'grade' | 'duration_minutes' | 'created_at'>;

export function HistoryClient() {
  const router = useRouter();
  const [lessons, setLessons] = useState<LessonCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from('lesson_plans')
      .select('id, title, subject, grade, duration_minutes, created_at')
      .order('created_at', { ascending: false });

    if (subjectFilter) {
      query = query.eq('subject', subjectFilter);
    }
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data } = await query;
    setLessons(data ?? []);
    setLoading(false);
  }, [search, subjectFilter]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const handleDelete = useCallback(async (id: string) => {
    const supabase = createClient();
    await supabase.from('lesson_plans').delete().eq('id', id);
    setDeleteId(null);
    setLessons((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const subjects = [...new Set(lessons.map((l) => l.subject))].sort();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-text-primary mb-6">
        Lesson History
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search by title..."
            aria-label="Search lessons by title"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-sm font-body text-text-primary placeholder:text-text-secondary focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral"
          />
        </div>
        {subjects.length > 1 && (
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            aria-label="Filter by subject"
            className="rounded-xl border border-border bg-surface px-3 py-2 text-sm font-body text-text-primary focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral"
          >
            <option value="">All subjects</option>
            {subjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 bg-surface rounded-xl" />
          ))}
        </div>
      ) : lessons.length === 0 ? (
        <p className="text-center font-body text-text-secondary py-12">
          {search || subjectFilter ? 'Nothing found — try a different search.' : 'No lessons yet.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.map((lesson) => (
            <Card
              key={lesson.id}
              className="group relative border-border/60 shadow-sm hover:shadow-md transition-shadow"
            >
              <CardContent className="p-5">
              <Link href={`/lesson/${lesson.id}`} className="block">
                <h3 className="font-display text-base font-semibold text-text-primary group-hover:text-coral transition-colors line-clamp-2 mb-2">
                  {lesson.title}
                </h3>
                <div className="flex items-center gap-3 text-xs font-body text-text-secondary mb-1">
                  <span className="inline-flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {lesson.subject}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {lesson.duration_minutes}m
                  </span>
                  <span>{lesson.grade}</span>
                </div>
                <p className="text-[10px] font-body text-text-secondary/60">
                  {new Date(lesson.created_at).toLocaleDateString()}
                </p>
              </Link>

              {/* Delete */}
              <button
                type="button"
                onClick={() => setDeleteId(lesson.id)}
                className="absolute top-3 right-3 p-2.5 rounded text-text-secondary/40 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label={`Delete ${lesson.title}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>

              {/* Delete confirmation */}
              {deleteId === lesson.id && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-surface/95 backdrop-blur-sm">
                  <div className="text-center px-4">
                    <p className="text-sm font-body text-text-primary mb-3">Delete this lesson?</p>
                    <div className="flex gap-2 justify-center">
                      <button
                        type="button"
                        onClick={() => handleDelete(lesson.id)}
                        className="rounded-lg bg-red-500 px-4 py-2.5 text-xs font-body text-white hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(null)}
                        className="rounded-lg border border-border px-4 py-2.5 text-xs font-body text-text-secondary hover:bg-muted transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
