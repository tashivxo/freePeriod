import { NextResponse } from 'next/server';
import {
  EMAIL_ALREADY_EXISTS,
  escapeIlikeExact,
  isValidEmailFormat,
  normalizeEmail,
} from '@/lib/auth/email';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const rawEmail =
      typeof body === 'object' && body !== null && 'email' in body
        ? String((body as { email: unknown }).email)
        : '';

    const normalized = normalizeEmail(rawEmail);
    if (!isValidEmailFormat(normalized)) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const pattern = escapeIlikeExact(normalized);
    const { data, error } = await admin
      .from('users')
      .select('id')
      .ilike('email', pattern)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[check-email]', error);
      return NextResponse.json(
        { error: 'Unable to verify email. Please try again.' },
        { status: 500 },
      );
    }

    if (data) {
      return NextResponse.json({ error: EMAIL_ALREADY_EXISTS }, { status: 409 });
    }

    return NextResponse.json({ available: true });
  } catch (err) {
    console.error('[check-email]', err);
    return NextResponse.json(
      { error: 'Unable to verify email. Please try again.' },
      { status: 500 },
    );
  }
}
