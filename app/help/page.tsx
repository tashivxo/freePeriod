import type { Metadata } from 'next';
import { HelpPageClient } from '@/features/help/components/HelpPageClient';
import { getMessages } from '@/lib/i18n';
import { readLocaleCookie } from '@/lib/i18n/server';
import { legalConfig } from '@/lib/legal/config';
import { createClient } from '@/lib/supabase/server';
import { getTrialDaysRemaining, isTrialActive } from '@/lib/utils/trial';
import type { Plan, Subscription } from '@/types';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await readLocaleCookie();
  const help = getMessages(locale).help;
  return {
    title: help.documentTitle,
    description: help.description,
  };
}

function supportPlanLabel(plan: Plan | string | null | undefined, trialDays: number | null): string | undefined {
  if (!plan) return undefined;
  return trialDays == null ? String(plan) : `${plan} (trial, ${trialDays} days left)`;
}

export default async function HelpPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return <HelpPageClient signedIn={false} supportEmail={legalConfig.contactEmail} />;
  }

  const [{ data: profile }, { data: subscriptionRow }] = await Promise.all([
    supabase.from('users').select('email, plan, is_admin').eq('id', authUser.id).maybeSingle(),
    supabase.from('subscriptions').select('*').eq('user_id', authUser.id).maybeSingle(),
  ]);

  const subscription = (subscriptionRow as Subscription | null) ?? null;
  const trialDays =
    subscription && isTrialActive(subscription.trial_end)
      ? getTrialDaysRemaining(subscription.trial_end)
      : null;
  const plan = supportPlanLabel(
    profile?.is_admin ? 'pro_plus' : (profile?.plan as Plan | undefined),
    trialDays,
  );

  return (
    <HelpPageClient
      signedIn
      supportEmail={legalConfig.contactEmail}
      accountEmail={profile?.email || authUser.email || ''}
      userId={authUser.id}
      plan={plan}
    />
  );
}
