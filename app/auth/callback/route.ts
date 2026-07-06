import { NextResponse } from 'next/server';
import type { EmailOtpType, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

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
) {
  const { data: existingProfile } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (existingProfile) return;

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
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const nextParam = searchParams.get('next');
  const next =
    nextParam ??
    (type === 'recovery' ? '/update-password' : '/dashboard');

  const supabase = await createClient();

  if (code) {
    const { error, data: sessionData } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (sessionData.user) {
        await ensureUserProfile(supabase, sessionData.user);
      }

      return redirectTo(request, next);
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

      if (user) {
        await ensureUserProfile(supabase, user);
      }

      return redirectTo(request, next);
    }
  }

  return NextResponse.redirect(
    `${new URL(request.url).origin}/sign-in?error=auth_callback_failed`,
  );
}
