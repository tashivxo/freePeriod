import { NextResponse } from 'next/server';
import { mapRecoveryAuthError, type RecoveryValidationResult } from '@/lib/auth/validate-recovery';
import { createClient } from '@/lib/supabase/server';

function json(result: RecoveryValidationResult, status = result.valid ? 200 : 401) {
  return NextResponse.json(result, { status });
}

/**
 * Validate a Supabase recovery token against the auth provider, or confirm an
 * existing recovery session from cookies.
 *
 * POST body: `{ token?: string, token_hash?: string }` — verifies via verifyOtp
 * (single-use) and establishes a session cookie when valid.
 * GET — checks the current session with getUser() (hits Auth, not local JWT only).
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ valid: false, reason: 'missing_token' }, 400);
  }

  const tokenRaw =
    typeof body === 'object' && body !== null
      ? ('token_hash' in body && typeof (body as { token_hash: unknown }).token_hash === 'string'
          ? (body as { token_hash: string }).token_hash
          : 'token' in body && typeof (body as { token: unknown }).token === 'string'
            ? (body as { token: string }).token
            : '')
      : '';

  const token = tokenRaw.trim();
  if (!token) {
    return json({ valid: false, reason: 'missing_token' }, 400);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    type: 'recovery',
    token_hash: token,
  });

  // #region agent log
  fetch('http://127.0.0.1:7810/ingest/5fe91cc7-a83e-4a00-85c2-1d832e7eebd5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3f48c7'},body:JSON.stringify({sessionId:'3f48c7',runId:'token-validate',hypothesisId:'C',location:'api/auth/validate-recovery:POST',message:'verifyOtp recovery token',data:{ok:!error&&Boolean(data.user),errorMessage:error?.message??null,errorCode:(error as {code?:string}|null)?.code??null,tokenLen:token.length},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  if (error || !data.user) {
    return json({
      valid: false,
      reason: mapRecoveryAuthError(error?.message, (error as { code?: string } | null)?.code),
    });
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return json({ valid: false, reason: 'invalid' });
  }

  return json({ valid: true });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // #region agent log
  fetch('http://127.0.0.1:7810/ingest/5fe91cc7-a83e-4a00-85c2-1d832e7eebd5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3f48c7'},body:JSON.stringify({sessionId:'3f48c7',runId:'token-validate',hypothesisId:'A',location:'api/auth/validate-recovery:GET',message:'getUser recovery session check',data:{ok:!error&&Boolean(user),errorMessage:error?.message??null},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  if (error || !user) {
    return json({ valid: false, reason: 'invalid' });
  }

  return json({ valid: true });
}
