export type RecoveryValidationReason = 'missing_token' | 'invalid' | 'expired';

export type RecoveryValidationResult =
  | { valid: true }
  | { valid: false; reason: RecoveryValidationReason };

export function isExpiredRecoveryError(message: string | null | undefined, code?: string | null): boolean {
  if (code === 'otp_expired') return true;
  const lower = (message ?? '').toLowerCase();
  return (
    lower.includes('expired') ||
    lower.includes('invalid') ||
    lower.includes('otp')
  );
}

export function mapRecoveryAuthError(
  message: string | null | undefined,
  code?: string | null,
): RecoveryValidationReason {
  if (isExpiredRecoveryError(message, code)) {
    // Prefer expired when Supabase says so; otherwise treat as invalid.
    if (code === 'otp_expired' || (message ?? '').toLowerCase().includes('expired')) {
      return 'expired';
    }
  }
  return 'invalid';
}
