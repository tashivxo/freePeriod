/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { updateSession } from './middleware';

const mockGetUser = jest.fn();
const mockFrom = jest.fn();

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
      signOut: jest.fn(),
    },
    from: mockFrom,
  })),
}));

function requestFor(pathname: string) {
  return new NextRequest(new URL(pathname, 'http://localhost:3000'));
}

describe('updateSession password recovery routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    mockGetUser.mockResolvedValue({ data: { user: null } });
  });

  it('allows unauthenticated access to /forgot-password', async () => {
    const response = await updateSession(requestFor('/forgot-password'));

    expect(response.status).not.toBe(307);
    expect(response.status).not.toBe(308);
    expect(response.headers.get('location')).toBeNull();
  });

  it('allows unauthenticated access to /update-password', async () => {
    const response = await updateSession(requestFor('/update-password'));

    expect(response.status).not.toBe(307);
    expect(response.status).not.toBe(308);
    expect(response.headers.get('location')).toBeNull();
  });

  it('allows unauthenticated access to /auth/callback for email recovery', async () => {
    const response = await updateSession(
      requestFor('/auth/callback?code=test-code&next=/update-password'),
    );

    expect(response.status).not.toBe(307);
    expect(response.status).not.toBe(308);
    expect(response.headers.get('location')).toBeNull();
  });

  it('forwards recovery params from landing page to auth callback', async () => {
    const response = await updateSession(
      requestFor('/?token_hash=recovery-hash&type=recovery'),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/auth/callback?token_hash=recovery-hash&type=recovery&next=%2Fupdate-password',
    );
  });

  it('forwards bare PKCE code from landing page without recovery next', async () => {
    const response = await updateSession(requestFor('/?code=pkce-code'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/auth/callback?code=pkce-code',
    );
  });

  it('forwards explicit safe recovery next with landing-page PKCE code', async () => {
    const response = await updateSession(
      requestFor('/?code=pkce-code&next=%2Fupdate-password'),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/auth/callback?code=pkce-code&next=%2Fupdate-password',
    );
  });

  it('preserves explicit safe next when forwarding landing-page auth params', async () => {
    const response = await updateSession(
      requestFor('/?code=pkce-code&next=%2Fdashboard'),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/auth/callback?code=pkce-code&next=%2Fdashboard',
    );
  });

  it('does not forward unrelated homepage query params', async () => {
    const response = await updateSession(
      requestFor('/?code=pkce-code&utm_source=email&ref=home'),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/auth/callback?code=pkce-code',
    );
  });

  it('does not forward unsafe next from landing-page PKCE code', async () => {
    const response = await updateSession(
      requestFor('/?code=pkce-code&next=//evil.example'),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/auth/callback?code=pkce-code',
    );
  });

  it('still redirects unauthenticated users away from protected routes', async () => {
    const response = await updateSession(requestFor('/dashboard'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/sign-in');
  });

  it('does not redirect authenticated users away from /update-password', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 't@example.com', user_metadata: {} } },
    });
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { deletion_scheduled_at: null } }),
      single: jest.fn().mockResolvedValue({ data: { onboarding_complete: false } }),
    });

    const response = await updateSession(requestFor('/update-password'));

    expect(response.headers.get('location')).toBeNull();
  });
});
