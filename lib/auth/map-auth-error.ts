/**
 * Map raw Supabase auth error messages to short, actionable copy.
 * Unknown messages pass through unchanged.
 */
export function mapAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes('invalid login') ||
    lower.includes('invalid credentials') ||
    lower.includes('invalid email or password')
  ) {
    return 'Incorrect email or password. Try again or reset your password.';
  }

  if (
    lower.includes('already registered') ||
    lower.includes('user already registered') ||
    lower.includes('already been registered') ||
    lower.includes('email address has already been registered')
  ) {
    return 'An account with this email already exists. Sign in instead.';
  }

  if (
    lower.includes('password') &&
    (lower.includes('weak') ||
      lower.includes('least') ||
      lower.includes('characters') ||
      lower.includes('too short'))
  ) {
    return 'Choose a stronger password with at least 8 characters.';
  }

  if (lower.includes('rate limit') || lower.includes('too many requests') || lower.includes('email rate limit')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }

  if (lower.includes('network') || lower.includes('failed to fetch')) {
    return 'Network error. Check your connection and try again.';
  }

  return message;
}
