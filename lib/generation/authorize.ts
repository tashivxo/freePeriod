import type { SupabaseClient } from '@supabase/supabase-js';
import { isRateLimited } from '@/lib/ai';
import { isTrialActive } from '@/lib/utils/trial';
import type { Database } from '@/types';

export type GenerationAccess = {
  userPlan: 'free' | 'pro';
  generationCount: number;
  isRateLimited: boolean;
};

export async function resolveGenerationAccess(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<GenerationAccess> {
  const [{ data: subData }, { data: userRecord }] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('plan, status, trial_end')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('users')
      .select('generation_count')
      .eq('id', userId)
      .single(),
  ]);

  const isTrial = subData?.status === 'trial' && isTrialActive(subData?.trial_end ?? null);
  const isPaid =
    subData?.status === 'active' && (subData?.plan === 'pro' || subData?.plan === 'pro_plus');
  const userPlan: 'free' | 'pro' = isPaid || isTrial ? 'pro' : 'free';
  const generationCount = userRecord?.generation_count ?? 0;

  return {
    userPlan,
    generationCount,
    isRateLimited: isRateLimited(userPlan, generationCount),
  };
}
