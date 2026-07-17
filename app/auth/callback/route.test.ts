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
      maybeSingle: jest.fn().mockResolvedValue({
        data: { id: 'user-1', onboarding_complete: false },
      }),
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

  it('defaults bare PKCE code callback to /onboarding when onboarding incomplete', async () => {
    const response = await GET(callbackRequest('?code=pkce-code'));

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('pkce-code');
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/onboarding');
  });

  it('defaults bare PKCE code callback to /dashboard when onboarding complete', async () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { id: 'user-1', onboarding_complete: true },
      }),
      insert: jest.fn().mockResolvedValue({ error: null }),
      upsert: jest.fn().mockResolvedValue({ error: null }),
    });

    const response = await GET(callbackRequest('?code=pkce-code'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard');
  });

  it('rejects unsafe next and falls back to /onboarding for incomplete users', async () => {
    const response = await GET(
      callbackRequest('?code=pkce-code&next=//evil.example'),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/onboarding');
  });

  it('rejects encoded protocol-relative next and falls back to /onboarding for incomplete users', async () => {
    const response = await GET(
      callbackRequest('?code=pkce-code&next=/%2f%2fevil.example'),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/onboarding');
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

  it('rejects unsafe next and falls back to /update-password for recovery', async () => {
    const response = await GET(
      callbackRequest('?token_hash=recovery-hash&type=recovery&next=https://evil.example'),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/update-password');
  });

  it('rejects encoded protocol-relative next and falls back to /update-password for recovery', async () => {
    const response = await GET(
      callbackRequest('?token_hash=recovery-hash&type=recovery&next=/%2f%2fevil.example'),
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
