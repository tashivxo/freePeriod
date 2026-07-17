import { Skeleton } from '@/components/ui/skeleton';

/** Pulse placeholder matching the auth card shell while Suspense resolves. */
export function AuthCardSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background/80 px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="mx-auto h-4 w-32" />
        </div>
      </div>
    </div>
  );
}
