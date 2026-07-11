import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  buildSubscriptionPayload,
  type LSSubscriptionWebhookData,
} from '@/lib/lemonsqueezy/subscriptions';
import type { Plan } from '@/types';

const SUBSCRIPTION_EVENTS = new Set([
  'subscription_created',
  'subscription_updated',
  'subscription_cancelled',
  'subscription_resumed',
  'subscription_expired',
  'subscription_paused',
  'subscription_unpaused',
  'subscription_payment_success',
  'subscription_payment_failed',
]);

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

type LemonSqueezyWebhook = {
  meta?: {
    event_name?: string;
    custom_data?: {
      user_id?: string;
    };
  };
  data?: {
    id?: string | number;
    attributes?: LSSubscriptionWebhookData & {
      variant_id?: string | number;
      customer_id?: string | number;
      order_id?: string | number;
      product_id?: string | number;
    };
  };
};

export async function POST(request: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-signature');

  if (!signature || !verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let event: LemonSqueezyWebhook;
  try {
    event = JSON.parse(rawBody) as LemonSqueezyWebhook;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventName = event.meta?.event_name;
  const userId = event.meta?.custom_data?.user_id;

  if (!eventName || !SUBSCRIPTION_EVENTS.has(eventName) || !userId) {
    return NextResponse.json({ received: true });
  }

  const attributes = event.data?.attributes;
  if (!attributes || event.data?.id == null) {
    return NextResponse.json({ received: true });
  }

  const webhookData: LSSubscriptionWebhookData = {
    id: event.data.id,
    customer_id: attributes.customer_id ?? '',
    order_id: attributes.order_id ?? '',
    product_id: attributes.product_id ?? '',
    variant_id: attributes.variant_id ?? '',
    status: attributes.status,
    renews_at: attributes.renews_at ?? null,
    ends_at: attributes.ends_at ?? null,
  };

  const payload = buildSubscriptionPayload(userId, webhookData);
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    await admin.from('subscriptions').update(payload).eq('user_id', userId);
  } else {
    await admin.from('subscriptions').insert({
      ...payload,
      trial_start: null,
      trial_end: null,
      trial_used: false,
    });
  }

  const activePlans: Plan[] = ['pro', 'pro_plus'];
  const userPlan: Plan =
    payload.status === 'active' || payload.status === 'on_trial'
      ? activePlans.includes(payload.plan)
        ? payload.plan
        : 'free'
      : 'free';

  await admin.from('users').update({ plan: userPlan }).eq('id', userId);

  return NextResponse.json({ received: true });
}
