import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error, data: sessionData } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Ensure public.users row exists (covers Google OAuth and other provider sign-ups)
      if (sessionData.user) {
        const { data: existingProfile } = await supabase
          .from('users')
          .select('id')
          .eq('id', sessionData.user.id)
          .maybeSingle();

        if (!existingProfile) {
          const metaFullName = sessionData.user.user_metadata?.full_name;
          const metaName = sessionData.user.user_metadata?.name;
          const displayName =
            (typeof metaFullName === 'string' ? metaFullName : null) ??
            (typeof metaName === 'string' ? metaName : null) ??
            sessionData.user.email?.split('@')[0] ??
            '';

          await supabase.from('users').insert({
            id: sessionData.user.id,
            email: sessionData.user.email ?? '',
            name: displayName,
            default_subject: null,
            default_grade: null,
            default_curriculum: null,
          });
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_failed`);
}
