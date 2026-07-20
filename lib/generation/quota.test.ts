import {
  PLAN_GENERATION_LIMITS,
  getPlanGenerationLimit,
  isRateLimited,
  resolveEffectivePlan,
  resolveGenerationMode,
  nextUtcMonthStart,
  shouldResetGenerationWindow,
  periodEndForReset,
} from './quota';
import type { Plan } from '@/types';

describe('PLAN_GENERATION_LIMITS', () => {
  it('maps free=3, pro=20, pro_plus=null', () => {
    expect(PLAN_GENERATION_LIMITS.free).toBe(3);
    expect(PLAN_GENERATION_LIMITS.pro).toBe(20);
    expect(PLAN_GENERATION_LIMITS.pro_plus).toBeNull();
  });
});

describe('isRateLimited', () => {
  it('limits free at 3', () => {
    expect(isRateLimited('free', 2)).toBe(false);
    expect(isRateLimited('free', 3)).toBe(true);
  });

  it('limits pro at 20', () => {
    expect(isRateLimited('pro', 19)).toBe(false);
    expect(isRateLimited('pro', 20)).toBe(true);
  });

  it('never limits pro_plus', () => {
    expect(isRateLimited('pro_plus', 10_000)).toBe(false);
  });
});

describe('resolveEffectivePlan', () => {
  const future = new Date(Date.now() + 86_400_000).toISOString();
  const past = new Date(Date.now() - 86_400_000).toISOString();

  it('returns active pro_plus', () => {
    expect(
      resolveEffectivePlan({ plan: 'pro_plus', status: 'active', trial_end: null }),
    ).toBe('pro_plus');
  });

  it('returns trial plan when trial is active', () => {
    expect(
      resolveEffectivePlan({ plan: 'pro', status: 'trial', trial_end: future }),
    ).toBe('pro');
    expect(
      resolveEffectivePlan({ plan: 'pro_plus', status: 'trial', trial_end: future }),
    ).toBe('pro_plus');
  });

  it('returns free when trial expired', () => {
    expect(
      resolveEffectivePlan({ plan: 'pro', status: 'trial', trial_end: past }),
    ).toBe('free');
  });

  it('returns free when no subscription', () => {
    expect(resolveEffectivePlan(null)).toBe('free');
  });
});

describe('resolveGenerationMode', () => {
  it('coerces free to fast even if quality requested', () => {
    expect(resolveGenerationMode('free', 'quality')).toBe('fast');
  });

  it('allows quality for pro and pro_plus', () => {
    expect(resolveGenerationMode('pro', 'quality')).toBe('quality');
    expect(resolveGenerationMode('pro_plus', 'fast')).toBe('fast');
  });

  it('defaults paid missing mode to quality', () => {
    expect(resolveGenerationMode('pro', undefined)).toBe('quality');
  });

  it('defaults free missing mode to fast', () => {
    expect(resolveGenerationMode('free', undefined)).toBe('fast');
  });
});

describe('nextUtcMonthStart', () => {
  it('returns first day of next month UTC', () => {
    const from = new Date('2026-07-19T15:00:00.000Z');
    expect(nextUtcMonthStart(from).toISOString()).toBe('2026-08-01T00:00:00.000Z');
  });
});

describe('shouldResetGenerationWindow', () => {
  it('resets when resetAt is null', () => {
    expect(shouldResetGenerationWindow(null, new Date())).toBe(true);
  });

  it('resets when now is at or after resetAt', () => {
    const now = new Date('2026-08-01T00:00:00.000Z');
    expect(shouldResetGenerationWindow('2026-08-01T00:00:00.000Z', now)).toBe(true);
  });

  it('does not reset when now is before resetAt', () => {
    const now = new Date('2026-07-19T12:00:00.000Z');
    expect(shouldResetGenerationWindow('2026-08-01T00:00:00.000Z', now)).toBe(false);
  });
});

describe('periodEndForReset', () => {
  it('uses renews_at for paid when present', () => {
    const renews = '2026-08-15T12:00:00.000Z';
    expect(
      periodEndForReset({ plan: 'pro' as Plan, renewsAt: renews, now: new Date('2026-07-19T00:00:00.000Z') }),
    ).toBe(renews);
  });

  it('falls back to nextUtcMonthStart when renews_at missing', () => {
    const now = new Date('2026-07-19T15:00:00.000Z');
    expect(
      periodEndForReset({ plan: 'pro', renewsAt: null, now }),
    ).toBe(nextUtcMonthStart(now).toISOString());
  });

  it('uses nextUtcMonthStart for free', () => {
    const now = new Date('2026-07-19T15:00:00.000Z');
    expect(
      periodEndForReset({ plan: 'free', renewsAt: '2026-08-15T12:00:00.000Z', now }),
    ).toBe(nextUtcMonthStart(now).toISOString());
  });
});
