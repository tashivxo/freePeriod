import { mapAuthError } from './map-auth-error';

describe('mapAuthError', () => {
  it('maps invalid credentials', () => {
    expect(mapAuthError('Invalid login credentials')).toMatch(/incorrect email or password/i);
  });

  it('maps already registered', () => {
    expect(mapAuthError('User already registered')).toMatch(/already exists/i);
  });

  it('maps weak password', () => {
    expect(mapAuthError('Password should be at least 8 characters')).toMatch(/stronger password/i);
  });

  it('passes through unknown messages', () => {
    expect(mapAuthError('Something weird happened')).toBe('Something weird happened');
  });
});
