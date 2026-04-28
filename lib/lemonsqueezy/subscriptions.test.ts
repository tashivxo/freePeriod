import {
  getPlanFromVariantId,
  getBillingIntervalFromVariantId,
  buildSubscriptionPayload,
} from './subscriptions';

describe('getPlanFromVariantId', () => {
  beforeEach(() => {
    process.env.LEMONSQUEEZY_VARIANT_ID_PRO_MONTHLY = 'v_pro_m';
    process.env.LEMONSQUEEZY_VARIANT_ID_PRO_YEARLY = 'v_pro_y';
    process.env.LEMONSQUEEZY_VARIANT_ID_PRO_PLUS_MONTHLY = 'v_pro_plus_m';
    process.env.LEMONSQUEEZY_VARIANT_ID_PRO_PLUS_YEARLY = 'v_pro_plus_y';
  });

  it('returns pro for monthly pro variant', () => {
    expect(getPlanFromVariantId('v_pro_m')).toBe('pro');
  });
  it('returns pro for yearly pro variant', () => {
    expect(getPlanFromVariantId('v_pro_y')).toBe('pro');
  });
  it('returns pro_plus for monthly pro_plus variant', () => {
    expect(getPlanFromVariantId('v_pro_plus_m')).toBe('pro_plus');
  });
  it('returns pro_plus for yearly pro_plus variant', () => {
    expect(getPlanFromVariantId('v_pro_plus_y')).toBe('pro_plus');
  });
  it('returns free for unknown variant', () => {
    expect(getPlanFromVariantId('unknown_id')).toBe('free');
  });
});

describe('getBillingIntervalFromVariantId', () => {
  beforeEach(() => {
    process.env.LEMONSQUEEZY_VARIANT_ID_PRO_MONTHLY = 'v_pro_m';
    process.env.LEMONSQUEEZY_VARIANT_ID_PRO_YEARLY = 'v_pro_y';
    process.env.LEMONSQUEEZY_VARIANT_ID_PRO_PLUS_MONTHLY = 'v_pro_plus_m';
    process.env.LEMONSQUEEZY_VARIANT_ID_PRO_PLUS_YEARLY = 'v_pro_plus_y';
  });

  it('returns monthly for pro monthly variant', () => {
    expect(getBillingIntervalFromVariantId('v_pro_m')).toBe('monthly');
  });
  it('returns yearly for pro yearly variant', () => {
    expect(getBillingIntervalFromVariantId('v_pro_y')).toBe('yearly');
  });
  it('returns monthly for pro_plus monthly variant', () => {
    expect(getBillingIntervalFromVariantId('v_pro_plus_m')).toBe('monthly');
  });
  it('returns yearly for pro_plus yearly variant', () => {
    expect(getBillingIntervalFromVariantId('v_pro_plus_y')).toBe('yearly');
  });
  it('returns null for unknown variant', () => {
    expect(getBillingIntervalFromVariantId('unknown')).toBeNull();
  });
});

describe('buildSubscriptionPayload', () => {
  beforeEach(() => {
    process.env.LEMONSQUEEZY_VARIANT_ID_PRO_MONTHLY = 'v_pro_m';
    process.env.LEMONSQUEEZY_VARIANT_ID_PRO_YEARLY = 'v_pro_y';
    process.env.LEMONSQUEEZY_VARIANT_ID_PRO_PLUS_MONTHLY = 'v_pro_plus_m';
    process.env.LEMONSQUEEZY_VARIANT_ID_PRO_PLUS_YEARLY = 'v_pro_plus_y';
  });

  it('maps pro monthly variant to plan=pro, interval=monthly', () => {
    const payload = buildSubscriptionPayload('user-123', {
      id: 99,
      customer_id: 1,
      order_id: 2,
      product_id: 3,
      variant_id: 'v_pro_m',
      status: 'active',
      renews_at: '2026-05-28',
      ends_at: null,
    });
    expect(payload.plan).toBe('pro');
    expect(payload.billing_interval).toBe('monthly');
    expect(payload.user_id).toBe('user-123');
    expect(payload.status).toBe('active');
  });

  it('maps pro_plus yearly variant to plan=pro_plus, interval=yearly', () => {
    const payload = buildSubscriptionPayload('user-456', {
      id: 100,
      customer_id: 2,
      order_id: 3,
      product_id: 4,
      variant_id: 'v_pro_plus_y',
      status: 'on_trial',
      renews_at: null,
      ends_at: '2026-06-28',
    });
    expect(payload.plan).toBe('pro_plus');
    expect(payload.billing_interval).toBe('yearly');
    expect(payload.ends_at).toBe('2026-06-28');
  });

  it('serialises numeric ids to strings', () => {
    const payload = buildSubscriptionPayload('user-789', {
      id: 42,
      customer_id: 7,
      order_id: 8,
      product_id: 9,
      variant_id: 'v_pro_m',
      status: 'active',
      renews_at: null,
      ends_at: null,
    });
    expect(payload.ls_subscription_id).toBe('42');
    expect(payload.ls_customer_id).toBe('7');
    expect(payload.ls_order_id).toBe('8');
    expect(payload.ls_product_id).toBe('9');
  });
});
