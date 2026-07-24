import { isValidEmailFormat, normalizeEmail } from '@/lib/auth/email';

export type EmailAvailabilityResult = 'available' | 'taken' | 'invalid' | 'error';

export async function checkEmailAvailability(email: string): Promise<EmailAvailabilityResult> {
  const normalized = normalizeEmail(email);
  if (!isValidEmailFormat(normalized)) {
    return 'invalid';
  }

  let res: Response;
  try {
    res = await fetch('/api/auth/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalized }),
    });
  } catch {
    return 'error';
  }

  if (res.status === 409) return 'taken';
  if (res.status === 400) return 'invalid';
  if (res.ok) return 'available';
  return 'error';
}
