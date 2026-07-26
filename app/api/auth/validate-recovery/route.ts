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

  if (error || !user) {
    return json({ valid: false, reason: 'invalid' });
  }

  return json({ valid: true });
}
