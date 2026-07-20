import type { Plan } from '@/types';
import {
  getPlanGenerationLimit,
  isRateLimited as quotaIsRateLimited,
  type GenerationMode,
} from '@/lib/generation/quota';

export const FREE_GENERATION_LIMIT = 3;
export const PRO_GENERATION_LIMIT = 20;

/** @deprecated Prefer resolveGenerationMode + Fast/Quality; kept for call sites during migration */
export function shouldUseGemini(modeOrPlan: GenerationMode | Plan): boolean {
  if (modeOrPlan === 'fast') return true;
  if (modeOrPlan === 'quality') return false;
  // Legacy: free plan used Gemini
  return modeOrPlan === 'free';
}

export function isRateLimited(plan: Plan, generationCount: number): boolean {
  return quotaIsRateLimited(plan, generationCount);
}

export { getPlanGenerationLimit };
