import { signInWithGoogle } from '@/lib/auth/google';

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/auth/map-auth-error', () => ({
  mapAuthError: (message: string) => `mapped:${message}`,
}));

describe('signInWithGoogle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts Google OAuth with the auth callback', async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const signInWithOAuth = jest.fn().mockResolvedValue({ error: null });
    (createClient as jest.Mock).mockReturnValue({
      auth: { signInWithOAuth },
    });

    await expect(signInWithGoogle()).resolves.toEqual({});
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'openid email profile',
      },
    });
  });

  it('returns a mapped error message when OAuth fails', async () => {
    const { createClient } = await import('@/lib/supabase/client');
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        signInWithOAuth: jest.fn().mockResolvedValue({
          error: { message: 'oauth failed' },
        }),
      },
    });

    await expect(signInWithGoogle()).resolves.toEqual({
      errorMessage: 'mapped:oauth failed',
    });
  });
});
