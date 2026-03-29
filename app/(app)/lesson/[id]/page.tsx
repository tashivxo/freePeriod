import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LessonView } from '@/components/lesson/LessonView';

type Props = {
  params: Promise<{ id: string }>;
};

async function LessonContent({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: lesson } = await supabase
    .from('lesson_plans')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!lesson) notFound();

  return <LessonView lesson={lesson} />;
}

function LessonSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 animate-pulse">
      <div className="h-4 w-32 bg-surface rounded mb-4" />
      <div className="h-8 w-2/3 bg-surface rounded mb-2" />
      <div className="h-4 w-1/3 bg-surface rounded mb-8" />
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-surface rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function LessonPage(props: Props) {
  return (
    <Suspense fallback={<LessonSkeleton />}>
      <LessonContent {...props} />
    </Suspense>
  );
}
