import type { BillingInterval, Plan } from '@/types';
import { getLS } from './client';

type PaidPlan = Extract<Plan, 'pro' | 'pro_plus'>;

export function getVariantIdForPlan(plan: PaidPlan, interval: BillingInterval): string {
  const envKey =
    plan === 'pro'
      ? interval === 'monthly'
        ? 'LEMONSQUEEZY_VARIANT_ID_PRO_MONTHLY'
        : 'LEMONSQUEEZY_VARIANT_ID_PRO_YEARLY'
      : interval === 'monthly'
        ? 'LEMONSQUEEZY_VARIANT_ID_PRO_PLUS_MONTHLY'
        : 'LEMONSQUEEZY_VARIANT_ID_PRO_PLUS_YEARLY';

  const variantId = process.env[envKey];
  if (!variantId) {
    throw new Error(`${envKey} is not set`);
  }
  return variantId;
}

export async function createCheckoutUrl(options: {
  plan: PaidPlan;
  interval: BillingInterval;
  userId: string;
  email?: string | null;
}): Promise<string> {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  if (!storeId) {
    throw new Error('LEMONSQUEEZY_STORE_ID is not set');
  }

  const variantId = getVariantIdForPlan(options.plan, options.interval);
  const { createCheckout } = getLS();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const { data, error } = await createCheckout(storeId, variantId, {
    checkoutData: {
      email: options.email ?? undefined,
      custom: { user_id: options.userId },
    },
    productOptions: {
      redirectUrl: `${appUrl}/settings?upgraded=true`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  const url = data?.data.attributes.url;
  if (!url) {
    throw new Error('Checkout URL missing from Lemon Squeezy response');
  }

  return url;
}
