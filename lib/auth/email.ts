export const EMAIL_ALREADY_EXISTS =
  'An account with this email already exists. Sign in instead.';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmailFormat(email: string): boolean {
  if (!email) return false;
  const at = email.indexOf('@');
  return at > 0 && at < email.length - 1 && !email.includes(' ');
}

/** Escape `%` and `_` for use as a literal ILIKE pattern (default escape `\`). */
export function escapeIlikeExact(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}
