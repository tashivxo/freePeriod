import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCheckoutUrl } from '@/lib/lemonsqueezy/checkout';
import type { BillingInterval, Plan } from '@/types';

const PAID_PLANS = new Set<Plan>(['pro', 'pro_plus']);
const BILLING_INTERVALS = new Set<BillingInterval>(['monthly', 'yearly']);

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const plan = (searchParams.get('plan') ?? 'pro') as Plan;
  const interval = (searchParams.get('interval') ?? 'monthly') as BillingInterval;

  if (!PAID_PLANS.has(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  if (!BILLING_INTERVALS.has(interval)) {
    return NextResponse.json({ error: 'Invalid billing interval' }, { status: 400 });
  }

  try {
    const url = await createCheckoutUrl({
      plan: plan as 'pro' | 'pro_plus',
      interval,
      userId: user.id,
      email: user.email,
    });
    return NextResponse.json({ url });
  } catch (err) {
    console.error('[checkout]', err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
