'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/ui/Logo';

export function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
    if (!validate()) return;

    setIsLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setIsLoading(false);

    if (error) {
      setServerError(error.message);
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

    setIsLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ email });
    setIsLoading(false);

    if (error) {
      setServerError(error.message);
      return;
    }

    setMagicLinkSent(true);
  }

  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'openid email profile https://www.googleapis.com/auth/drive.readonly',
      },
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Logo size="lg" />
          <div>
            <h1 className="text-2xl font-display font-bold text-text-primary">
              Welcome back
            </h1>
            <p className="mt-1 font-body text-sm text-text-secondary">
              Sign in to continue planning lessons
            </p>
          </div>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-6 space-y-5">

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
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="current-password"
          />

          <Button type="submit" className="w-full" isLoading={isLoading}>
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
          >
            Continue with Google
          </Button>

          <Button
            variant="ghost"
            className="w-full"
            onClick={handleMagicLink}
            type="button"
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
