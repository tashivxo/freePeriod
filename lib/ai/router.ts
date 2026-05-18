import type { Plan } from '@/types';

export const FREE_GENERATION_LIMIT = 50;

export function shouldUseGemini(plan: Plan): boolean {
  return plan === 'free';
}

export function isRateLimited(plan: Plan, generationCount: number): boolean {
  return plan === 'free' && generationCount >= FREE_GENERATION_LIMIT;
}
