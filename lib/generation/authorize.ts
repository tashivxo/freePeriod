import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Plan } from '@/types';
import {
  getPlanGenerationLimit,
  isRateLimited,
  periodEndForReset,
  resolveEffectivePlan,
  shouldResetGenerationWindow,
} from '@/lib/generation/quota';

export type GenerationAccess = {
  userPlan: Plan;
  generationCount: number;
  generationLimit: number | null;
  isRateLimited: boolean;
};

export async function resolveGenerationAccess(
  supabase: SupabaseClient<Database>,
  userId: string,
  now: Date = new Date(),
): Promise<GenerationAccess> {
  const [{ data: subData }, { data: userRecord }] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('plan, status, trial_end, renews_at')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('users')
      .select('generation_count, generation_count_reset_at, is_admin')
      .eq('id', userId)
      .single(),
  ]);

  const userPlan = resolveEffectivePlan(subData, userRecord?.is_admin ?? false);
  let generationCount = userRecord?.generation_count ?? 0;
  const resetAt = userRecord?.generation_count_reset_at ?? null;

  if (shouldResetGenerationWindow(resetAt, now)) {
    const nextReset = periodEndForReset({
      plan: userPlan,
      renewsAt: subData?.renews_at ?? null,
      now,
    });
    generationCount = 0;
    await supabase
      .from('users')
      .update({
        generation_count: 0,
        generation_count_reset_at: nextReset,
      })
      .eq('id', userId);
  }

  const generationLimit = getPlanGenerationLimit(userPlan);

  return {
    userPlan,
    generationCount,
    generationLimit,
    isRateLimited: isRateLimited(userPlan, generationCount),
  };
}
