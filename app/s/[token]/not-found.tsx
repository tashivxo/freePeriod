import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/ui/branding/Logo';
import { Button } from '@/components/ui/Button';
import { getMessages } from '@/lib/i18n';
import { readLocaleCookie } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await readLocaleCookie();
  return {
    title: getMessages(locale).share.notFoundDocumentTitle,
    robots: { index: false, follow: false },
  };
}

export default async function SharedLessonNotFound() {
  const locale = await readLocaleCookie();
  const t = getMessages(locale).share;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/60 px-4 py-4">
        <Link href="/" className="inline-flex">
          <Logo size="sm" />
        </Link>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <p className="font-display text-6xl font-bold text-text-secondary/40">404</p>
        <h1 className="mt-4 font-display text-2xl font-semibold text-text-primary">{t.notFoundTitle}</h1>
        <p className="mt-2 max-w-md font-body text-text-secondary">{t.notFoundBody}</p>
        <Button asChild className="mt-6">
          <Link href="/">{t.backHome}</Link>
        </Button>
      </div>
    </div>
  );
}