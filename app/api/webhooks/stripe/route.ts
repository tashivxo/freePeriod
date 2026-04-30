import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

function getStripe(): Stripe {
  // Lazy-init: avoids build-time crash when STRIPE_SECRET_KEY is not set in Vercel env
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    // @ts-expect-error — stripe-js typings may lag behind the installed SDK version
    apiVersion: '2025-05-28.basil',
  });
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = await createClient();

  switch (event.type) {
    case 'customer.subscription.trial_will_end': {
      const subscription = event.data.object as Stripe.Subscription;
      await supabase
        .from('subscriptions')
        .update({ trial_used: true })
        .eq('stripe_subscription_id', subscription.id);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
