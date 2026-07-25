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
  const cookieHeader = request.headers.get('cookie') ?? '';
  const hasPkceCookie = /code-verifier|pkce/i.test(cookieHeader);

  // #region agent log
  fetch('http://127.0.0.1:7810/ingest/5fe91cc7-a83e-4a00-85c2-1d832e7eebd5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3f48c7'},body:JSON.stringify({sessionId:'3f48c7',runId:'pre-fix',hypothesisId:'A,B,C',location:'app/auth/callback/route.ts:GET:entry',message:'auth callback entry',data:{hasCode:Boolean(code),hasTokenHash:Boolean(tokenHash),type,nextParam,hasPkceCookie,cookieCount:cookieHeader?cookieHeader.split(';').length:0,paramKeys:[...searchParams.keys()]},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  const supabase = await createClient();

  if (code) {
    const { error, data: sessionData } = await supabase.auth.exchangeCodeForSession(code);

    // #region agent log
    fetch('http://127.0.0.1:7810/ingest/5fe91cc7-a83e-4a00-85c2-1d832e7eebd5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3f48c7'},body:JSON.stringify({sessionId:'3f48c7',runId:'pre-fix',hypothesisId:'A,C',location:'app/auth/callback/route.ts:GET:pkce',message:'PKCE exchangeCodeForSession result',data:{ok:!error,errorMessage:error?.message??null,errorCode:(error as {code?:string}|null)?.code??null,hasUser:Boolean(sessionData?.user),hasPkceCookie,type,nextParam},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    if (!error) {
      let onboardingComplete = false;
      if (sessionData.user) {
        const profile = await ensureUserProfile(supabase, sessionData.user);
        onboardingComplete = profile.onboardingComplete;
      }

      const dest = resolveNext(nextParam, type, onboardingComplete);
      // #region agent log
      fetch('http://127.0.0.1:7810/ingest/5fe91cc7-a83e-4a00-85c2-1d832e7eebd5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3f48c7'},body:JSON.stringify({sessionId:'3f48c7',runId:'pre-fix',hypothesisId:'C',location:'app/auth/callback/route.ts:GET:pkce-success',message:'PKCE success redirect',data:{dest,onboardingComplete,type,nextParam},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      return redirectTo(request, dest);
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    // #region agent log
    fetch('http://127.0.0.1:7810/ingest/5fe91cc7-a83e-4a00-85c2-1d832e7eebd5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3f48c7'},body:JSON.stringify({sessionId:'3f48c7',runId:'pre-fix',hypothesisId:'D',location:'app/auth/callback/route.ts:GET:otp',message:'verifyOtp recovery result',data:{ok:!error,errorMessage:error?.message??null,errorCode:(error as {code?:string}|null)?.code??null,type,nextParam,tokenHashLen:tokenHash.length},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let onboardingComplete = false;
      if (user) {
        const profile = await ensureUserProfile(supabase, user);
        onboardingComplete = profile.onboardingComplete;
      }

      const dest = resolveNext(nextParam, type, onboardingComplete);
      // #region agent log
      fetch('http://127.0.0.1:7810/ingest/5fe91cc7-a83e-4a00-85c2-1d832e7eebd5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3f48c7'},body:JSON.stringify({sessionId:'3f48c7',runId:'pre-fix',hypothesisId:'D',location:'app/auth/callback/route.ts:GET:otp-success',message:'OTP success redirect',data:{dest,onboardingComplete,type,nextParam},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      return redirectTo(request, dest);
    }
  }

  // Implicit/hash recovery: Supabase may redirect to this route with only
  // next=/update-password in the query and tokens in the URL hash (invisible
  // to the server). Send the browser to /update-password so the client can
  // pick up #access_token&type=recovery. Same destination for failed OTP so
  // UpdatePasswordPage can show the expired-link CTA.
  const isRecoveryAttempt =
    type === 'recovery' || nextParam === '/update-password';

  // #region agent log
  fetch('http://127.0.0.1:7810/ingest/5fe91cc7-a83e-4a00-85c2-1d832e7eebd5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3f48c7'},body:JSON.stringify({sessionId:'3f48c7',runId:'post-fix',hypothesisId:'A,B,C,D,E',location:'app/auth/callback/route.ts:GET:fail',message:'auth callback failure branch',data:{hasCode:Boolean(code),hasTokenHash:Boolean(tokenHash),type,nextParam,hasPkceCookie,isRecoveryAttempt,dest:isRecoveryAttempt?'/update-password':'/sign-in?error=auth_callback_failed'},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  if (isRecoveryAttempt) {
    return redirectTo(request, '/update-password');
  }

  return NextResponse.redirect(
    `${new URL(request.url).origin}/sign-in?error=auth_callback_failed`,
  );
}
