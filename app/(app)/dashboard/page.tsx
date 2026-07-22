import { Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { resolveGenerationAccess } from '@/lib/generation/authorize';
import { formatGenerationUsage } from '@/lib/generation/quota';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BlurText } from '@/components/ui/effects/BlurText';
import { RecentLessons } from '@/features/dashboard/components/RecentLessons';
import type { LessonPlanCardData } from '@/features/lesson/components/LessonPlanCard';

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

function mapRecentLessons(
  lessons: {
    id: string;
    title: string;
    subject: string;
    grade: string;
    duration_minutes: number;
    created_at: string;
    content: unknown;
  }[],
): LessonPlanCardData[] {
  return lessons.map((lesson) => {
    const objectives = (lesson.content as Record<string, unknown>)?.objectives;
    const firstObjective =
      Array.isArray(objectives) && objectives.length > 0 ? String(objectives[0]) : null;

    return {
      id: lesson.id,
      title: lesson.title,
      subject: lesson.subject,
      grade: lesson.grade,
      duration_minutes: lesson.duration_minutes,
      created_at: lesson.created_at,
      firstObjective,
    };
  });
}

async function DashboardContent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: profile }, { data: lessons }, generationAccess] = await Promise.all([
    supabase.from('users').select('name').eq('id', user.id).single(),
    supabase
      .from('lesson_plans')
      .select('id, title, subject, grade, duration_minutes, created_at, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(9),
    resolveGenerationAccess(supabase, user.id),
  ]);

  const usageLabel = formatGenerationUsage({
    plan: generationAccess.userPlan,
    generationCount: generationAccess.generationCount,
    generationLimit: generationAccess.generationLimit,
  });

  const authName = (user.user_metadata?.full_name ?? user.user_metadata?.name ?? '') as string;
  const nameSource = (profile?.name || authName).trim();
  const firstName = nameSource.split(' ')[0] || 'there';

  const recentLessons = lessons ? mapRecentLessons(lessons) : [];

  return (
    <div className="relative">
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8">
      {/* Greeting */}
      <BlurText as="h1" text={`Hi, ${firstName}!`} className="font-display text-3xl font-bold text-text-primary mb-1" />
      <p className="font-body text-text-secondary mb-6">{usageLabel}</p>

      {/* Quick generate */}
      <Button asChild className="mb-8">
        <Link href="/generate" className="gap-2">
          <Plus className="h-5 w-5" />
          New Lesson Plan
        </Link>
      </Button>

      {/* Recent lessons */}
      {recentLessons.length > 0 ? (
        <RecentLessons initialLessons={recentLessons} />
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
          <p className="font-body text-text-secondary mb-4">
            No lessons yet. Create your first one!
          </p>
          <Button asChild variant="outline" className="gap-1.5">
            <Link href="/generate">
              <Plus className="h-4 w-4" />
              Generate Lesson
            </Link>
          </Button>
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
