/**
 * @jest-environment node
 */
import crypto from 'crypto';

const SECRET = 'ls-webhook-secret';

const mockSubMaybeSingle = jest.fn();
const mockSubUpdate = jest.fn();
const mockSubInsert = jest.fn();
const mockUserUpdate = jest.fn();
const mockCreateAdminClient = jest.fn();

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => mockCreateAdminClient(...args),
}));

import { POST } from '@/app/api/webhooks/lemonsqueezy/route';

function sign(body: string): string {
  return crypto.createHmac('sha256', SECRET).update(body).digest('hex');
}

function subscriptionAttributes(overrides: Record<string, unknown> = {}) {
  return {
    customer_id: 11,
    order_id: 22,
    product_id: 33,
    variant_id: 'v_pro_m',
    status: 'active',
    renews_at: '2026-12-01T00:00:00.000Z',
    ends_at: null,
    ...overrides,
  };
}

function webhookBody(eventName: string, attributes: Record<string, unknown> = {}) {
  return JSON.stringify({
    meta: {
      event_name: eventName,
      custom_data: { user_id: 'user-1' },
    },
    data: {
      id: 99,
      attributes: subscriptionAttributes(attributes),
    },
  });
}

function postEvent(eventName: string, attributes: Record<string, unknown> = {}) {
  const body = webhookBody(eventName, attributes);
  return POST(
    new Request('http://localhost/api/webhooks/lemonsqueezy', {
      method: 'POST',
      headers: { 'x-signature': sign(body) },
      body,
    }),
  );
}

describe('POST /api/webhooks/lemonsqueezy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = SECRET;
    process.env.LEMONSQUEEZY_VARIANT_ID_PRO_MONTHLY = 'v_pro_m';
    process.env.LEMONSQUEEZY_VARIANT_ID_PRO_YEARLY = 'v_pro_y';
    process.env.LEMONSQUEEZY_VARIANT_ID_PRO_PLUS_MONTHLY = 'v_pro_plus_m';
    process.env.LEMONSQUEEZY_VARIANT_ID_PRO_PLUS_YEARLY = 'v_pro_plus_y';
    mockSubMaybeSingle.mockResolvedValue({ data: { id: 'sub-1' }, error: null });
    mockSubUpdate.mockResolvedValue({ error: null });
    mockSubInsert.mockResolvedValue({ error: null });
    mockUserUpdate.mockResolvedValue({ error: null });
    mockCreateAdminClient.mockReturnValue({
      from: (table: string) => {
        if (table === 'subscriptions') {
          return {
            select: () => ({
              eq: () => ({ maybeSingle: mockSubMaybeSingle }),
            }),
            update: (payload: unknown) => ({
              eq: () => mockSubUpdate(payload),
            }),
            insert: (payload: unknown) => mockSubInsert(payload),
          };
        }
        if (table === 'users') {
          return {
            update: (payload: unknown) => ({
              eq: () => mockUserUpdate(payload),
            }),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      },
    });
  });

  it('does not change plan on subscription_payment_success', async () => {
    const response = await postEvent('subscription_payment_success', { status: 'paid' });

    expect(response.status).toBe(200);
    expect(mockCreateAdminClient).not.toHaveBeenCalled();
    expect(mockUserUpdate).not.toHaveBeenCalled();
    expect(mockSubUpdate).not.toHaveBeenCalled();
    expect(mockSubInsert).not.toHaveBeenCalled();
  });

  it('does not change plan on order_created', async () => {
    const response = await postEvent('order_created', { status: 'paid' });

    expect(response.status).toBe(200);
    expect(mockCreateAdminClient).not.toHaveBeenCalled();
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('returns 5xx when the subscription write fails so Lemon Squeezy retries', async () => {
    mockSubUpdate.mockResolvedValue({ error: { message: 'write failed' } });

    const response = await postEvent('subscription_updated', { status: 'active' });

    expect(response.status).toBeGreaterThanOrEqual(500);
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('returns 5xx when the users.plan write fails', async () => {
    mockUserUpdate.mockResolvedValue({ error: { message: 'plan write failed' } });

    const response = await postEvent('subscription_updated', { status: 'active' });

    expect(response.status).toBeGreaterThanOrEqual(500);
  });

  it('keeps cancelled subscriptions on the paid plan until ends_at', async () => {
    const endsAt = new Date(Date.now() + 86_400_000).toISOString();
    const response = await postEvent('subscription_cancelled', {
      status: 'cancelled',
      ends_at: endsAt,
    });

    expect(response.status).toBe(200);
    expect(mockUserUpdate).toHaveBeenCalledWith({ plan: 'pro' });
  });

  it('sets plan to free when a cancelled subscription has already ended', async () => {
    const endsAt = new Date(Date.now() - 86_400_000).toISOString();
    const response = await postEvent('subscription_cancelled', {
      status: 'cancelled',
      ends_at: endsAt,
    });

    expect(response.status).toBe(200);
    expect(mockUserUpdate).toHaveBeenCalledWith({ plan: 'free' });
  });

  it('treats on_trial as paid access', async () => {
    const response = await postEvent('subscription_updated', { status: 'on_trial' });

    expect(response.status).toBe(200);
    expect(mockUserUpdate).toHaveBeenCalledWith({ plan: 'pro' });
  });
});
