import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getSubscription, lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';
import { createClient } from '@/lib/supabase/server';
import { resolveGenerationAccess } from '@/lib/generation/authorize';
import { getMessages } from '@/lib/i18n';
import { readLocaleCookie } from '@/lib/i18n/server';
import { getTrialDaysRemaining, isTrialActive } from '@/lib/utils/trial';
import { legalConfig } from '@/lib/legal/config';
import { SettingsClient } from './SettingsClient';
import type { Subscription, User } from '@/types';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await readLocaleCookie();
  return { title: getMessages(locale).settings.documentTitle };
}

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

    const { data: newProfile, error: insertError } = await supabase
      .from('users')
      .insert({
        id: authUser.id,
        email: authUser.email ?? '',
        name: displayName,
        default_subject: null,
        default_grade: null,
        default_curriculum: null,
      })
      .select('*')
      .single();

    if (insertError || !newProfile) redirect('/onboarding');
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
  const generationAccess = await resolveGenerationAccess(supabase, authUser.id);
  const trialDays =
    subscription && isTrialActive(subscription.trial_end)
      ? getTrialDaysRemaining(subscription.trial_end)
      : null;
  const manageSubscriptionUrl = await resolveCustomerPortalUrl(
    subscription?.ls_subscription_id ?? null,
  );

  return (
    <SettingsClient
      user={user}
      email={email}
      usagePlan={generationAccess.userPlan}
      generationCount={generationAccess.generationCount}
      generationLimit={generationAccess.generationLimit}
      trialDays={trialDays}
      manageSubscriptionUrl={manageSubscriptionUrl}
      supportEmail={legalConfig.contactEmail}
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
