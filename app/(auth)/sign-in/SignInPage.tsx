'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import { mapAuthError } from '@/lib/auth/map-auth-error';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/ui/Logo';

export function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!password.trim()) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError('');
    if (!validate() || authBusy) return;

    setAuthBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setServerError(mapAuthError(error.message));
      setAuthBusy(false);
      return;
    }

    // Ensure profile row exists for users who signed up before row-creation was implemented
    const { data: { user: signedInUser } } = await supabase.auth.getUser();
    if (signedInUser) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('id', signedInUser.id)
        .maybeSingle();
      if (!existing) {
        await supabase.from('users').insert({
          id: signedInUser.id,
          email,
          name: signedInUser.user_metadata?.name ?? email.split('@')[0],
          default_subject: null,
          default_grade: null,
          default_curriculum: null,
        });
      }
    }

    router.refresh();
    router.push(searchParams.get('next') ?? '/dashboard');
  }

  async function handleMagicLink() {
    setServerError('');
    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }
    if (authBusy) return;

    setAuthBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ email });
    setAuthBusy(false);

    if (error) {
      setServerError(mapAuthError(error.message));
      return;
    }

    setMagicLinkSent(true);
  }

  async function handleGoogleLogin() {
    if (authBusy) return;
    setAuthBusy(true);
    setServerError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'openid email profile',
      },
    });
    if (error) {
      setServerError(mapAuthError(error.message));
      setAuthBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background/80 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo size="lg" />
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary">
              Welcome back
            </h1>
            <p className="mt-1.5 font-body text-sm leading-relaxed text-text-secondary">
              Sign in to continue planning lessons
            </p>
          </div>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="space-y-5 p-6">

        {serverError && (
          <div role="alert" className="p-3 rounded-xl bg-error/10 text-error text-sm text-center">
            {serverError}
          </div>
        )}

        {magicLinkSent && (
          <div role="status" className="p-3 rounded-xl bg-success/10 text-success text-sm text-center">
            Check your email for a magic link!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
          />
          <div className="space-y-1">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="current-password"
              endAdornment={
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center text-text-secondary transition-colors hover:text-text-primary"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs text-text-secondary hover:text-coral transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Switch
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(!!checked)}
                className="data-checked:bg-coral"
                aria-label="Remember me"
                aria-describedby="remember-me-hint"
              />
              <label
                htmlFor="remember-me"
                className="cursor-pointer select-none font-body text-sm text-text-secondary"
              >
                Remember me
              </label>
            </div>
            <p id="remember-me-hint" className="pl-12 text-xs text-text-secondary">
              You stay signed in on this browser until you sign out. Session length follows
              your browser&apos;s saved sign-in — not a permanent login.
            </p>
          </div>

          <Button type="submit" className="w-full" isLoading={authBusy}>
            Sign in
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-text-secondary/20" />
          <span className="text-sm text-text-secondary">or</span>
          <div className="flex-1 h-px bg-text-secondary/20" />
        </div>

        <div className="space-y-3">
          <Button
            className="w-full"
            onClick={handleGoogleLogin}
            type="button"
            disabled={authBusy}
          >
            Continue with Google
          </Button>

          <Button
            variant="ghost"
            className="w-full"
            onClick={handleMagicLink}
            type="button"
            disabled={authBusy}
          >
            Send magic link
          </Button>
        </div>

        <p className="text-center text-sm font-body text-text-secondary">
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className="text-coral font-semibold hover:underline">
            Sign up
          </Link>
        </p>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
