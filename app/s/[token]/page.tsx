import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookOpen, Clock } from 'lucide-react';
import { Logo } from '@/components/ui/branding/Logo';
import { SharedLessonDownloadButton } from '@/features/share/components/SharedLessonDownloadButton';
import { SharedLessonSections } from '@/features/share/components/SharedLessonSections';
import { createAdminClient } from '@/lib/supabase/admin';
import { getMessages } from '@/lib/i18n';
import { readLocaleCookie } from '@/lib/i18n/server';
import { createT, formatDurationShort } from '@/lib/i18n/format';
import { formatGradeLabel } from '@/lib/utils/grades';
import { stripAdaptiveSelfPointers } from '@/lib/lesson/adaptive-self-reference';
import type { LessonShareSnapshot } from '@/lib/share/snapshot';
import type { LessonSection } from '@/types';

type PageProps = { params: Promise<{ token: string }> };

async function loadShare(token: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('lesson_shares')
    .select('snapshot, file_name, token')
    .eq('token', token)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const share = await loadShare(token);
  const locale = await readLocaleCookie();
  const messages = getMessages(locale);
  if (!share) {
    return {
      title: messages.share.notFoundDocumentTitle,
      robots: { index: false, follow: false },
    };
  }
  const snapshot = share.snapshot as LessonShareSnapshot;
  return {
    title: `${snapshot.title} | ${messages.share.brandLine}`,
    robots: { index: false, follow: false },
  };
}

export default async function SharedLessonPage({ params }: PageProps) {
  const { token } = await params;
  const share = await loadShare(token);
  if (!share) {
    notFound();
  }

  const locale = await readLocaleCookie();
  const messages = getMessages(locale);
  const snapshot = share.snapshot as LessonShareSnapshot;
  const content = stripAdaptiveSelfPointers(snapshot.content as LessonSection);
  const t = createT(locale);
  const durationLabel = formatDurationShort(snapshot.duration_minutes, t);
  const gradeLabel = formatGradeLabel(snapshot.grade, t);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-surface/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <Logo size="sm" />
          </Link>
          <span className="font-body text-sm text-text-secondary">{messages.share.brandLine}</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-display text-3xl font-bold text-text-primary mb-2">{snapshot.title}</h1>

        <div className="mb-6 flex flex-wrap items-center gap-4 text-sm font-body text-text-secondary">
          <span className="inline-flex items-center gap-1">
            <BookOpen className="h-4 w-4" aria-hidden />
            {snapshot.subject} · {gradeLabel}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-4 w-4" aria-hidden />
            {durationLabel}
          </span>
          {snapshot.curriculum ? <span>{snapshot.curriculum}</span> : null}
        </div>

        <div className="mb-8">
          <SharedLessonDownloadButton token={share.token} fileName={share.file_name} />
        </div>

        <SharedLessonSections content={content} />

        <p className="mt-10 text-center font-body text-xs text-text-secondary/80">
          {messages.share.madeWith}
        </p>
      </main>
    </div>
  );
}