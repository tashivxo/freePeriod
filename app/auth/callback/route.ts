import { NextResponse } from 'next/server';
import type { EmailOtpType, User } from '@supabase/supabase-js';
import { isSafeInternalPath } from '@/lib/auth/safe-redirect';
import { createClient } from '@/lib/supabase/server';

function resolveNext(
  nextParam: string | null,
  type: EmailOtpType | null,
  onboardingComplete: boolean,
): string {
  if (nextParam && isSafeInternalPath(nextParam)) {
    return nextParam;
  }
  if (type === 'recovery') {
    return '/update-password';
  }
  return onboardingComplete ? '/dashboard' : '/onboarding';
}

function redirectTo(request: Request, next: string) {
  const { origin } = new URL(request.url);
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';

  if (isLocalEnv) {
    return NextResponse.redirect(`${origin}${next}`);
  }
  if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`);
  }
  return NextResponse.redirect(`${origin}${next}`);
}

async function ensureUserProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: User,
): Promise<{ onboardingComplete: boolean }> {
  const { data: existingProfile } = await supabase
    .from('users')
    .select('id, onboarding_complete')
    .eq('id', user.id)
    .maybeSingle();

  if (existingProfile) {
    return { onboardingComplete: Boolean(existingProfile.onboarding_complete) };
  }

  const metaFullName = user.user_metadata?.full_name;
  const metaName = user.user_metadata?.name;
  const displayName =
    (typeof metaFullName === 'string' ? metaFullName : null) ??
    (typeof metaName === 'string' ? metaName : null) ??
    user.email?.split('@')[0] ??
    '';

  await supabase.from('users').insert({
    id: user.id,
    email: user.email ?? '',
    name: displayName,
    default_subject: null,
    default_grade: null,
    default_curriculum: null,
  });

  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(trialEnd.getDate() + 30);
  await supabase.from('subscriptions').upsert(
    {
      user_id: user.id,
      plan: 'free',
      status: 'trial',
      trial_start: now.toISOString(),
      trial_end: trialEnd.toISOString(),
      trial_used: false,
    },
    { onConflict: 'user_id' },
  );

  return { onboardingComplete: false };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const nextParam = searchParams.get('next');

  const supabase = await createClient();

  if (code) {
    const { error, data: sessionData } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      let onboardingComplete = false;
      if (sessionData.user) {
        const profile = await ensureUserProfile(supabase, sessionData.user);
        onboardingComplete = profile.onboardingComplete;
      }

      return redirectTo(request, resolveNext(nextParam, type, onboardingComplete));
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let onboardingComplete = false;
      if (user) {
        const profile = await ensureUserProfile(supabase, user);
        onboardingComplete = profile.onboardingComplete;
      }

      return redirectTo(request, resolveNext(nextParam, type, onboardingComplete));
    }
  }

  return NextResponse.redirect(
    `${new URL(request.url).origin}/sign-in?error=auth_callback_failed`,
  );
}
