import type { BillingInterval, Plan, SubscriptionStatus } from '@/types';

export function getPlanFromVariantId(variantId: string): Plan {
  const proVariants = [
    process.env.LEMONSQUEEZY_VARIANT_ID_PRO_MONTHLY,
    process.env.LEMONSQUEEZY_VARIANT_ID_PRO_YEARLY,
  ].filter(Boolean) as string[];

  const proPlusVariants = [
    process.env.LEMONSQUEEZY_VARIANT_ID_PRO_PLUS_MONTHLY,
    process.env.LEMONSQUEEZY_VARIANT_ID_PRO_PLUS_YEARLY,
  ].filter(Boolean) as string[];

  if (proVariants.includes(variantId)) return 'pro';
  if (proPlusVariants.includes(variantId)) return 'pro_plus';
  return 'free';
}

export function getBillingIntervalFromVariantId(variantId: string): BillingInterval | null {
  const monthlyVariants = [
    process.env.LEMONSQUEEZY_VARIANT_ID_PRO_MONTHLY,
    process.env.LEMONSQUEEZY_VARIANT_ID_PRO_PLUS_MONTHLY,
  ].filter(Boolean) as string[];

  const yearlyVariants = [
    process.env.LEMONSQUEEZY_VARIANT_ID_PRO_YEARLY,
    process.env.LEMONSQUEEZY_VARIANT_ID_PRO_PLUS_YEARLY,
  ].filter(Boolean) as string[];

  if (monthlyVariants.includes(variantId)) return 'monthly';
  if (yearlyVariants.includes(variantId)) return 'yearly';
  return null;
}

export interface LSSubscriptionWebhookData {
  id: number | string;
  customer_id: number | string;
  order_id: number | string;
  product_id: number | string;
  variant_id: number | string;
  status: string;
  renews_at: string | null;
  ends_at: string | null;
}

export function buildSubscriptionPayload(
  userId: string,
  webhookData: LSSubscriptionWebhookData,
) {
  const variantId = String(webhookData.variant_id);
  return {
    user_id: userId,
    ls_subscription_id: String(webhookData.id),
    ls_customer_id: String(webhookData.customer_id),
    ls_order_id: String(webhookData.order_id),
    ls_product_id: String(webhookData.product_id),
    ls_variant_id: variantId,
    plan: getPlanFromVariantId(variantId),
    billing_interval: getBillingIntervalFromVariantId(variantId),
    status: webhookData.status as SubscriptionStatus,
    renews_at: webhookData.renews_at ?? null,
    ends_at: webhookData.ends_at ?? null,
    updated_at: new Date().toISOString(),
  };
}
