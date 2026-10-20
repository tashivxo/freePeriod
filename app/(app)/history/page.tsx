import type { Metadata } from 'next';
import { Suspense } from 'react';
import { HistoryClient } from '@/features/history/components/HistoryClient';
import { getMessages } from '@/lib/i18n';
import { readLocaleCookie } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await readLocaleCookie();
  return { title: getMessages(locale).history.documentTitle };
}

function HistorySkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 animate-pulse">
      <div className="h-8 w-48 bg-surface border border-border rounded mb-6" />
      <div className="h-10 w-full bg-surface border border-border rounded-lg mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 bg-surface border border-border rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<HistorySkeleton />}>
      <HistoryClient />
    </Suspense>
  );
}
