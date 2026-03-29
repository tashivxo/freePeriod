import { Suspense } from 'react';
import { HistoryClient } from './HistoryClient';

export const metadata = { title: 'Lesson History — FreePeriod' };

function HistorySkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
      <div className="h-10 w-full bg-gray-200 rounded-lg mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 bg-gray-100 rounded-xl" />
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
