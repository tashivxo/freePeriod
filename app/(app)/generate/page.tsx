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
    const [{ data: userData }, { data: subData }] = await Promise.all([
      supabase
        .from('users')
        .select('default_subject, default_grade, default_curriculum')
        .eq('id', user.id)
        .single(),
      supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle(),
    ]);

    userPlan = subData?.plan === 'pro' ? 'pro' : 'free';

    if (userData) {
      if (userData.default_subject || userData.default_grade || userData.default_curriculum) {
        defaults = {
          subject: userData.default_subject ?? '',
          grade: userData.default_grade ?? '',
          curriculum: userData.default_curriculum ?? '',
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
