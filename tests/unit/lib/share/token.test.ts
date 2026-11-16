import { generateShareToken } from '@/lib/share/token';

describe('generateShareToken', () => {
  it('returns URL-safe tokens with sufficient length', () => {
    const a = generateShareToken();
    const b = generateShareToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(21);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});