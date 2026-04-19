import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthPage =
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up');
  const isOnboardingPage = pathname.startsWith('/onboarding');
  const isSettingsPage = pathname.startsWith('/settings');

  // Unauthenticated users can only access auth pages and the home page
  if (!user && !isAuthPage && pathname !== '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  // Authenticated users should not see auth pages
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  // Redirect authenticated users who haven't completed onboarding
  if (user && !isAuthPage && !isOnboardingPage && !isSettingsPage && pathname !== '/') {
    const { data } = await supabase
      .from('users')
      .select('onboarding_complete')
      .eq('id', user.id)
      .single();

    if (!data) {
      // Auto-provision profile row for users who signed up before row-creation was implemented
      const metaFullName = user.user_metadata?.full_name;
      const metaName = user.user_metadata?.name;
      const displayName =
        (typeof metaFullName === 'string' ? metaFullName : null) ??
        (typeof metaName === 'string' ? metaName : null) ??
        user.email?.split('@')[0] ?? '';
      await supabase.from('users').upsert(
        {
          id: user.id,
          email: user.email ?? '',
          name: displayName,
          default_subject: null,
          default_grade: null,
          default_curriculum: null,
        },
        { onConflict: 'id' }
      );
      const url = request.nextUrl.clone();
      url.pathname = '/onboarding';
      const redirectResponse = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value);
      });
      return redirectResponse;
    }

    if (data && !data.onboarding_complete) {
      const url = request.nextUrl.clone();
      url.pathname = '/onboarding';
      const redirectResponse = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value);
      });
      return redirectResponse;
    }
  }

  return supabaseResponse;
}
