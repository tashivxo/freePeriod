import {
  FREE_GENERATION_LIMIT,
  PRO_GENERATION_LIMIT,
  shouldUseGemini,
  isRateLimited,
} from './router';

describe('limits', () => {
  it('exposes free=3 and pro=20', () => {
    expect(FREE_GENERATION_LIMIT).toBe(3);
    expect(PRO_GENERATION_LIMIT).toBe(20);
  });
});

describe('shouldUseGemini', () => {
  it('is true only for fast mode', () => {
    expect(shouldUseGemini('fast')).toBe(true);
    expect(shouldUseGemini('quality')).toBe(false);
  });
});

describe('isRateLimited', () => {
  it('limits free at 3 and pro at 20; never pro_plus', () => {
    expect(isRateLimited('free', 3)).toBe(true);
    expect(isRateLimited('pro', 20)).toBe(true);
    expect(isRateLimited('pro_plus', 999)).toBe(false);
  });
});
