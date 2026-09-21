import { createClient } from '@/lib/supabase/client';
import { mapAuthError } from '@/lib/auth/map-auth-error';

export async function signInWithGoogle(): Promise<{ errorMessage?: string }> {
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
}
