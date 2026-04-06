import { Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Plus, BookOpen, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppBackground } from '@/components/animations/AppBackground';

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 animate-pulse">
      <div className="h-8 w-48 bg-surface rounded mb-6" />
      <div className="h-12 w-40 bg-surface rounded-xl mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 bg-surface rounded-xl" />
        ))}
      </div>
    </div>
  );
}

async function DashboardContent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: profile }, { data: lessons }] = await Promise.all([
    supabase.from('users').select('name, generation_count').eq('id', user.id).single(),
    supabase
      .from('lesson_plans')
      .select('id, title, subject, grade, duration_minutes, created_at, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(9),
  ]);

  const firstName = profile?.name?.split(' ')[0] ?? 'there';

  return (
    <div className="relative">
      <AppBackground />
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8">
      {/* Greeting */}
      <h1 className="font-display text-3xl font-bold text-text-primary mb-1">
        Hi, {firstName}!
      </h1>
      <p className="font-body text-text-secondary mb-6">
        <Badge variant="secondary" className="mr-2">{profile?.generation_count ?? 0}</Badge>
        lesson{(profile?.generation_count ?? 0) !== 1 ? 's' : ''} generated
      </p>

      {/* Quick generate */}
      <Link
        href="/generate"
        className="mb-8 inline-flex items-center justify-center gap-2 rounded-xl bg-coral px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-coral/90 focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2"
      >
        <Plus className="h-5 w-5" />
        New Lesson Plan
      </Link>

      {/* Recent lessons */}
      {lessons && lessons.length > 0 ? (
        <>
          <h2 className="font-display text-xl font-semibold text-text-primary mb-4">
            Recent Lessons
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lessons.map((lesson) => {
              const objectives = (lesson.content as Record<string, unknown>)?.objectives;
              const firstObjective =
                Array.isArray(objectives) && objectives.length > 0
                  ? String(objectives[0])
                  : null;

              return (
              <Link
                key={lesson.id}
                href={`/lesson/${lesson.id}`}
              >
                <Card className="group border-border/60 bg-surface shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-5">
                  <h3 className="font-display text-base font-semibold text-text-primary group-hover:text-coral transition-colors line-clamp-2 mb-2">
                    {lesson.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs font-body text-text-secondary mb-3">
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
                  {firstObjective && (
                    <p className="text-xs font-body text-text-secondary line-clamp-2">
                      {firstObjective}
                    </p>
                  )}
                  <p className="mt-3 text-[10px] font-body text-text-secondary/60">
                    {new Date(lesson.created_at).toLocaleDateString()}
                  </p>
                  </CardContent>
                </Card>
              </Link>
              );
            })}
          </div>

          {lessons.length >= 9 && (
            <div className="mt-6 text-center">
              <Link
                href="/history"
                className="text-sm font-body text-coral hover:underline"
              >
                View all lessons →
              </Link>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
          <p className="font-body text-text-secondary mb-4">
            No lessons yet. Create your first one!
          </p>
          <Link
            href="/generate"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary shadow-sm transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Generate Lesson
          </Link>
        </div>
      )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
