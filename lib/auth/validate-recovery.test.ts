import { isExpiredRecoveryError, mapRecoveryAuthError } from './validate-recovery';

describe('validate-recovery helpers', () => {
  it('detects otp_expired code', () => {
    expect(isExpiredRecoveryError('anything', 'otp_expired')).toBe(true);
    expect(mapRecoveryAuthError('Email link is invalid or has expired', 'otp_expired')).toBe(
      'expired',
    );
  });

  it('maps generic auth errors to invalid', () => {
    expect(mapRecoveryAuthError('Token has been used', null)).toBe('invalid');
  });
});
