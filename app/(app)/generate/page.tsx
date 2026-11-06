import type { Metadata } from 'next';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { resolveEffectivePlan } from '@/lib/generation/quota';
import { loadDefaultTemplateForUser } from '@/lib/lesson/load-default-template';
import { GenerateClient } from '@/features/generate/components/GenerateClient';
import type { Plan } from '@/types';
import { getMessages } from '@/lib/i18n';
import { readLocaleCookie } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await readLocaleCookie();
  return { title: getMessages(locale).generate.documentTitle };
}

async function GeneratePageContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let defaults: { subject: string; grade: string; curriculum: string } | undefined;
  let userPlan: Plan = 'free';
  let userId: string | undefined;
  let defaultTemplate: { path: string; fileName: string } | null = null;
  let defaultTemplateMissing = false;

  if (user) {
    userId = user.id;
    const [{ data: userData }, { data: subData }, loadedDefault] = await Promise.all([
      supabase
        .from('users')
        .select(
          'default_subject, default_grade, default_curriculum, is_admin, default_template_path, default_template_file_name',
        )
        .eq('id', user.id)
        .single(),
      supabase
        .from('subscriptions')
        .select('plan, status, trial_end, ends_at')
        .eq('user_id', user.id)
        .maybeSingle(),
      loadDefaultTemplateForUser(supabase, user.id),
    ]);

    userPlan = resolveEffectivePlan(subData, userData?.is_admin ?? false);

    if (userData) {
      if (userData.default_subject || userData.default_grade || userData.default_curriculum) {
        defaults = {
          subject: userData.default_subject ?? '',
          grade: userData.default_grade ?? '',
          curriculum: userData.default_curriculum ?? '',
        };
      }
    }

    if (loadedDefault.status === 'present') {
      defaultTemplate = { path: loadedDefault.path, fileName: loadedDefault.fileName };
    } else if (loadedDefault.status === 'missing') {
      defaultTemplateMissing = true;
    }
  }

  return (
    <GenerateClient
      defaults={defaults}
      plan={userPlan}
      userId={userId}
      defaultTemplate={defaultTemplate}
      defaultTemplateMissing={defaultTemplateMissing}
    />
  );
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
