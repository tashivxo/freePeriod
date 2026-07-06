/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from './route';

const mockExchangeCodeForSession = jest.fn();
const mockVerifyOtp = jest.fn();
const mockGetUser = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
      verifyOtp: mockVerifyOtp,
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

function callbackRequest(query: string) {
  return new NextRequest(new URL(`http://localhost:3000/auth/callback${query}`));
}

describe('GET /auth/callback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'development';
    mockExchangeCodeForSession.mockResolvedValue({
      error: null,
      data: { user: { id: 'user-1', email: 't@example.com', user_metadata: {} } },
    });
    mockVerifyOtp.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 't@example.com', user_metadata: {} } },
    });
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'user-1' } }),
      insert: jest.fn().mockResolvedValue({ error: null }),
      upsert: jest.fn().mockResolvedValue({ error: null }),
    });
  });

  it('redirects to next after exchanging PKCE code', async () => {
    const response = await GET(
      callbackRequest('?code=pkce-code&next=/update-password'),
    );

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('pkce-code');
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/update-password');
  });

  it('redirects recovery token_hash flow to /update-password by default', async () => {
    const response = await GET(
      callbackRequest('?token_hash=recovery-hash&type=recovery'),
    );

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      type: 'recovery',
      token_hash: 'recovery-hash',
    });
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/update-password');
  });

  it('redirects recovery token_hash flow to explicit next param', async () => {
    const response = await GET(
      callbackRequest('?token_hash=recovery-hash&type=recovery&next=/update-password'),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/update-password');
  });

  it('redirects to sign-in when callback has no auth params', async () => {
    const response = await GET(callbackRequest(''));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/sign-in?error=auth_callback_failed',
    );
  });
});
