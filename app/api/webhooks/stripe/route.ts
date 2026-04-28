import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // @ts-expect-error — stripe-js typings may lag behind the installed SDK version
  apiVersion: '2025-05-28.basil',
});

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[stripe-webhook] Signature verification failed:', message);
    return new Response(`Webhook signature verification failed: ${message}`, { status: 400 });
  }

  const supabase = await createClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        if (!userId || !subscriptionId) {
          console.error('[stripe-webhook] checkout.session.completed missing user_id or subscription', session.id);
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id ?? null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000).toISOString();

        await Promise.all([
          supabase.from('subscriptions').upsert(
            {
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              stripe_price_id: priceId,
              plan: 'pro',
              status: subscription.status,
              current_period_end: currentPeriodEnd,
              cancel_at_period_end: subscription.cancel_at_period_end,
            },
            { onConflict: 'user_id' },
          ),
          supabase.from('users').update({ plan: 'pro' }).eq('id', userId),
        ]);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price.id ?? null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000).toISOString();
        const plan = subscription.status === 'active' ? 'pro' : 'free';

        const { data: subRecord } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!subRecord?.user_id) {
          console.warn('[stripe-webhook] customer.subscription.updated: no user found for customer', customerId);
          break;
        }

        await Promise.all([
          supabase
            .from('subscriptions')
            .update({
              stripe_price_id: priceId,
              plan,
              status: subscription.status,
              current_period_end: currentPeriodEnd,
              cancel_at_period_end: subscription.cancel_at_period_end,
            })
            .eq('stripe_customer_id', customerId),
          supabase.from('users').update({ plan }).eq('id', subRecord.user_id),
        ]);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: subRecord } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!subRecord?.user_id) {
          console.warn('[stripe-webhook] customer.subscription.deleted: no user found for customer', customerId);
          break;
        }

        await Promise.all([
          supabase
            .from('subscriptions')
            .update({ status: 'canceled', plan: 'free' })
            .eq('stripe_customer_id', customerId),
          supabase.from('users').update({ plan: 'free' }).eq('id', subRecord.user_id),
        ]);
        break;
      }

      default:
        // Unhandled event type — ignore
        break;
    }
  } catch (err) {
    console.error('[stripe-webhook] Handler error for event', event.type, err);
    return new Response('Internal error processing webhook', { status: 500 });
  }

  return new Response('OK', { status: 200 });
}
