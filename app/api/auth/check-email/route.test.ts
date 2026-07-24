/**
 * @jest-environment node
 */
jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}));

import { createAdminClient } from '@/lib/supabase/admin';
import { EMAIL_ALREADY_EXISTS } from '@/lib/auth/email';
import { POST } from './route';

function mockUserLookup(exists: boolean, dbError: Error | null = null) {
  const maybeSingle = jest.fn().mockResolvedValue({
    data: exists ? { id: 'user-uuid' } : null,
    error: dbError,
  });
  const limit = jest.fn().mockReturnValue({ maybeSingle });
  const ilike = jest.fn().mockReturnValue({ limit });
  const select = jest.fn().mockReturnValue({ ilike });
  const from = jest.fn().mockReturnValue({ select });
  (createAdminClient as jest.Mock).mockReturnValue({ from });
  return { from, select, ilike, limit, maybeSingle };
}

function postCheckEmail(email: string) {
  return POST(
    new Request('http://localhost/api/auth/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }),
  );
}

describe('POST /api/auth/check-email', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 when email is available', async () => {
    mockUserLookup(false);
    const res = await postCheckEmail('new@example.com');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ available: true });
  });

  it('returns 409 when email is taken', async () => {
    mockUserLookup(true);
    const res = await postCheckEmail('taken@example.com');
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe(EMAIL_ALREADY_EXISTS);
  });

  it('returns 400 for invalid email', async () => {
    const res = await postCheckEmail('not-an-email');
    expect(res.status).toBe(400);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it('normalizes email before lookup', async () => {
    const chain = mockUserLookup(false);
    await postCheckEmail('  Jane@Example.COM  ');
    expect(chain.ilike).toHaveBeenCalledWith('email', 'jane@example.com');
  });

  it('returns 500 on database error without leaking details', async () => {
    mockUserLookup(false, { message: 'secret db error' } as Error);
    const res = await postCheckEmail('user@example.com');
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Unable to verify email. Please try again.');
    expect(JSON.stringify(body)).not.toMatch(/secret db error/);
  });
});
