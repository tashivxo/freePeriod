import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LessonView } from '@/features/lesson/components/LessonView';
import { lessonDocumentTitleFromPlan } from '@/lib/lesson/page-title';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { title: lessonDocumentTitleFromPlan(null) };
  }

  const { data: lesson } = await supabase
    .from('lesson_plans')
    .select('title, content')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  return { title: lessonDocumentTitleFromPlan(lesson) };
}

export default async function LessonPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
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
