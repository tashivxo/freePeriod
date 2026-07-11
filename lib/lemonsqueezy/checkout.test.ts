import { getVariantIdForPlan } from './checkout';

describe('getVariantIdForPlan', () => {
  beforeEach(() => {
    process.env.LEMONSQUEEZY_VARIANT_ID_PRO_MONTHLY = 'v_pro_m';
    process.env.LEMONSQUEEZY_VARIANT_ID_PRO_YEARLY = 'v_pro_y';
    process.env.LEMONSQUEEZY_VARIANT_ID_PRO_PLUS_MONTHLY = 'v_pro_plus_m';
    process.env.LEMONSQUEEZY_VARIANT_ID_PRO_PLUS_YEARLY = 'v_pro_plus_y';
  });

  it('returns the monthly pro variant id', () => {
    expect(getVariantIdForPlan('pro', 'monthly')).toBe('v_pro_m');
  });

  it('returns the yearly pro plus variant id', () => {
    expect(getVariantIdForPlan('pro_plus', 'yearly')).toBe('v_pro_plus_y');
  });

  it('throws when the variant env var is missing', () => {
    delete process.env.LEMONSQUEEZY_VARIANT_ID_PRO_MONTHLY;
    expect(() => getVariantIdForPlan('pro', 'monthly')).toThrow(
      'LEMONSQUEEZY_VARIANT_ID_PRO_MONTHLY is not set',
    );
  });
});
