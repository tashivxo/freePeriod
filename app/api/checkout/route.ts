import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // @ts-expect-error — stripe-js typings may lag behind the installed SDK version
  apiVersion: '2025-05-28.basil',
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const plan = searchParams.get('plan') ?? 'pro';
  const priceId =
    plan === 'pro_plus'
      ? process.env.STRIPE_PRICE_ID_PRO_PLUS!
      : process.env.STRIPE_PRICE_ID_PRO!;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { user_id: user.id },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
  });

  return NextResponse.json({ url: session.url });
}
