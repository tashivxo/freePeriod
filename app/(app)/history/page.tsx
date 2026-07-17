import { Suspense } from 'react';
import { HistoryClient } from '@/features/history/components/HistoryClient';

export const metadata = { title: 'Lesson Plan History — FreePeriod' };

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
