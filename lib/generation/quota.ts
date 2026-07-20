import type { Plan } from '@/types';
import { isTrialActive } from '@/lib/utils/trial';

export type GenerationMode = 'fast' | 'quality';

export const PLAN_GENERATION_LIMITS: Record<Plan, number | null> = {
  free: 3,
  pro: 20,
  pro_plus: null,
};

export function getPlanGenerationLimit(plan: Plan): number | null {
  return PLAN_GENERATION_LIMITS[plan];
}

export function isRateLimited(plan: Plan, generationCount: number): boolean {
  const limit = getPlanGenerationLimit(plan);
  return limit !== null && generationCount >= limit;
}

export type SubscriptionSnapshot = {
  plan: Plan | null;
  status: string | null;
  trial_end: string | null;
} | null;

export function resolveEffectivePlan(sub: SubscriptionSnapshot, isAdmin?: boolean): Plan {
  if (isAdmin) return 'pro_plus';
  if (!sub?.plan) return 'free';
  if (sub.status === 'active' && (sub.plan === 'pro' || sub.plan === 'pro_plus')) {
    return sub.plan;
  }
  if (sub.status === 'trial' && isTrialActive(sub.trial_end) && (sub.plan === 'pro' || sub.plan === 'pro_plus')) {
    return sub.plan;
  }
  return 'free';
}

export function resolveGenerationMode(
  plan: Plan,
  requested: GenerationMode | undefined,
): GenerationMode {
  if (plan === 'free') return 'fast';
  if (requested === 'fast' || requested === 'quality') return requested;
  return 'quality';
}

export function nextUtcMonthStart(from: Date): Date {
  return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1, 0, 0, 0, 0));
}

export function shouldResetGenerationWindow(resetAt: string | null, now: Date): boolean {
  if (!resetAt) return true;
  return now.getTime() >= new Date(resetAt).getTime();
}

export function periodEndForReset(input: {
  plan: Plan;
  renewsAt: string | null;
  now: Date;
}): string {
  if (input.plan !== 'free' && input.renewsAt) {
    return input.renewsAt;
  }
  return nextUtcMonthStart(input.now).toISOString();
}

export function formatGenerationUsage(input: {
  plan: Plan;
  generationCount: number;
  generationLimit: number | null;
}): string {
  if (input.generationLimit === null) {
    return `${input.generationCount} generated this period (Unlimited)`;
  }
  return `${input.generationCount} of ${input.generationLimit} used this period`;
}
