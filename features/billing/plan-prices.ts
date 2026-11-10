export type BillablePlanId = 'free' | 'pro' | 'pro_plus';

export const PLAN_PRICES: Record<BillablePlanId, { monthly: number; annual: number }> = {
  free: { monthly: 0, annual: 0 },
  pro: { monthly: 9, annual: 7 },
  pro_plus: { monthly: 12, annual: 10 },
};

export function priceForInterval(
  planId: BillablePlanId,
  interval: 'monthly' | 'yearly',
): number {
  return interval === 'yearly' ? PLAN_PRICES[planId].annual : PLAN_PRICES[planId].monthly;
}
