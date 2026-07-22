'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import {
  LessonPlanCard,
  type LessonPlanCardData,
} from '@/features/lesson/components/LessonPlanCard';

type RecentLessonsProps = {
  initialLessons: LessonPlanCardData[];
};

export function RecentLessons({ initialLessons }: RecentLessonsProps) {
  const [lessons, setLessons] = useState(initialLessons);

  const handleDelete = useCallback(async (id: string) => {
    const supabase = createClient();
    await supabase.from('lesson_plans').delete().eq('id', id);
    setLessons((prev) => prev.filter((l) => l.id !== id));
  }, []);

  if (lessons.length === 0) {
    return (
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
    );
  }

  return (
    <>
      <h2 className="font-display text-xl font-semibold text-text-primary mb-4">
        Recent Lessons
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {lessons.map((lesson) => (
          <LessonPlanCard
            key={lesson.id}
            lesson={lesson}
            onDelete={handleDelete}
            showObjective
          />
        ))}
      </div>
      <div className="mt-6 text-center">
        <Button asChild variant="link" className="text-coral">
          <Link href="/history">View all lessons →</Link>
        </Button>
      </div>
    </>
  );
}
