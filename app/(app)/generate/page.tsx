import type { Metadata } from 'next';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { GenerateClient } from './GenerateClient';

export const metadata: Metadata = {
  title: 'Generate — FreePeriod',
};

async function GeneratePageContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let defaults: { subject: string; grade: string; curriculum: string } | undefined;

  let userPlan: 'free' | 'pro' = 'free';

  if (user) {
    const { data } = await supabase
      .from('users')
      .select('default_subject, default_grade, default_curriculum, plan')
      .eq('id', user.id)
      .single();

    if (data) {
      userPlan = (data.plan ?? 'free') as 'free' | 'pro';
      if (data.default_subject || data.default_grade || data.default_curriculum) {
        defaults = {
          subject: data.default_subject ?? '',
          grade: data.default_grade ?? '',
          curriculum: data.default_curriculum ?? '',
        };
      }
    }
  }

  return <GenerateClient defaults={defaults} plan={userPlan} />;
}

export default function GeneratePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-12">
          <div className="h-10 w-64 mx-auto mb-8 animate-pulse rounded-xl bg-text-secondary/10" />
          <div className="space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-13 w-full animate-pulse rounded-xl bg-text-secondary/10"
              />
            ))}
          </div>
        </div>
      }
    >
      <GeneratePageContent />
    </Suspense>
  );
}
