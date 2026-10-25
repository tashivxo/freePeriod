import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LessonView } from '@/features/lesson/components/LessonView';
import { DEFAULT_LOCALE } from '@/lib/i18n';
import { resolveOwnedLessonPage } from '@/lib/lesson/resolve-lesson-page';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const resolved = await resolveOwnedLessonPage(id, DEFAULT_LOCALE);
  if (resolved.status === 404) notFound();
  return { title: resolved.title };
}

export default async function LessonPage({ params }: Props) {
  const { id } = await params;
  const resolved = await resolveOwnedLessonPage(id, DEFAULT_LOCALE);
  if (resolved.status === 404) notFound();
  return <LessonView lesson={resolved.lesson} />;
}
