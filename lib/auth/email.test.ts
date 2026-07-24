import { escapeIlikeExact, isValidEmailFormat, normalizeEmail } from './email';

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Jane@Example.COM  ')).toBe('jane@example.com');
  });
});

describe('isValidEmailFormat', () => {
  it('accepts a basic email', () => {
    expect(isValidEmailFormat('a@b.co')).toBe(true);
  });

  it('rejects empty and malformed values', () => {
    expect(isValidEmailFormat('')).toBe(false);
    expect(isValidEmailFormat('@b.co')).toBe(false);
    expect(isValidEmailFormat('a@')).toBe(false);
    expect(isValidEmailFormat('a @b.co')).toBe(false);
  });
});

describe('escapeIlikeExact', () => {
  it('escapes ilike metacharacters', () => {
    expect(escapeIlikeExact('a%b_c')).toBe('a\\%b\\_c');
  });
});
