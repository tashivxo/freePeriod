import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getSubscription, lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';
import { createClient } from '@/lib/supabase/server';
import { getTrialDaysRemaining, isTrialActive } from '@/lib/utils/trial';
import { SettingsClient } from './SettingsClient';
import type { Plan, Subscription, User } from '@/types';

export const metadata = { title: 'Settings — FreePeriod' };

const PLAN_LABELS: Record<Plan, string> = {
  free: 'Free',
  pro: 'Pro',
  pro_plus: 'Pro+',
};

function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 animate-pulse">
      <div className="h-8 w-32 bg-surface border border-border rounded mb-8" />
      <div className="h-48 bg-surface border border-border rounded-xl mb-8" />
      <div className="h-48 bg-surface border border-border rounded-xl mb-8" />
      <div className="h-24 bg-surface border border-border rounded-xl" />
    </div>
  );
}

function formatPlanLabel(plan: Plan, subscription: Subscription | null): string {
  const base = PLAN_LABELS[plan] ?? 'Free';
  if (!subscription || !isTrialActive(subscription.trial_end)) return base;
  const days = getTrialDaysRemaining(subscription.trial_end);
  return `${base} · Trial (${days} day${days === 1 ? '' : 's'} left)`;
}

async function resolveCustomerPortalUrl(
  lsSubscriptionId: string | null,
): Promise<string | null> {
  if (!lsSubscriptionId) return null;
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) return null;

  try {
    lemonSqueezySetup({ apiKey });
    const { data, error } = await getSubscription(lsSubscriptionId);
    if (error) return null;
    return data?.data?.attributes?.urls?.customer_portal ?? null;
  } catch {
    return null;
  }
}

async function SettingsContent() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  let resolvedProfile = profile;
  if (!resolvedProfile) {
    // Auto-provision profile row for users created before row-creation was implemented
    const metaFullName = authUser.user_metadata?.full_name;
    const metaName = authUser.user_metadata?.name;
    const displayName =
      (typeof metaFullName === 'string' ? metaFullName : null) ??
      (typeof metaName === 'string' ? metaName : null) ??
      authUser.email?.split('@')[0] ?? '';

    const { data: newProfile, error: upsertError } = await supabase
      .from('users')
      .upsert(
        {
          id: authUser.id,
          email: authUser.email ?? '',
          name: displayName,
          default_subject: null,
          default_grade: null,
          default_curriculum: null,
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single();

    if (upsertError || !newProfile) redirect('/onboarding');
    resolvedProfile = newProfile;
  }

  const user = resolvedProfile as User;

  const { data: subscriptionRow } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', authUser.id)
    .maybeSingle();

  const subscription = (subscriptionRow as Subscription | null) ?? null;
  const email = user.email || authUser.email || '';
  const planLabel = formatPlanLabel(user.plan, subscription);
  const manageSubscriptionUrl = await resolveCustomerPortalUrl(
    subscription?.ls_subscription_id ?? null,
  );

  return (
    <SettingsClient
      user={user}
      email={email}
      planLabel={planLabel}
      manageSubscriptionUrl={manageSubscriptionUrl}
    />
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}
