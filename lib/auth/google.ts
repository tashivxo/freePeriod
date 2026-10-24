import { createClient } from '@/lib/supabase/client';
import { AUTH_UNEXPECTED_ERROR, mapAuthError } from '@/lib/auth/map-auth-error';

export async function signInWithGoogle(): Promise<{ errorMessage?: string }> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'openid email profile',
      },
    });

    if (error) return { errorMessage: mapAuthError(error.message) };
    return {};
  } catch {
    // A thrown error would otherwise leave the caller's button spinning forever.
    return { errorMessage: AUTH_UNEXPECTED_ERROR };
  }
}
