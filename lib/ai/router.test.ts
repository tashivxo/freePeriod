import { shouldUseGemini, isRateLimited, FREE_GENERATION_LIMIT } from './router';

describe('FREE_GENERATION_LIMIT', () => {
  it('is 50', () => {
    expect(FREE_GENERATION_LIMIT).toBe(50);
  });
});

describe('shouldUseGemini', () => {
  it('returns true for free plan', () => {
    expect(shouldUseGemini('free')).toBe(true);
  });

  it('returns false for pro plan', () => {
    expect(shouldUseGemini('pro')).toBe(false);
  });
});

describe('isRateLimited', () => {
  it('returns false when free plan user has 49 generations', () => {
    expect(isRateLimited('free', 49)).toBe(false);
  });

  it('returns true when free plan user has exactly 50 generations', () => {
    expect(isRateLimited('free', 50)).toBe(true);
  });

  it('returns true when free plan user has more than 50 generations', () => {
    expect(isRateLimited('free', 99)).toBe(true);
  });

  it('returns false for pro plan regardless of generation count', () => {
    expect(isRateLimited('pro', 100)).toBe(false);
  });

  it('returns false when free plan user has 0 generations', () => {
    expect(isRateLimited('free', 0)).toBe(false);
  });
});
