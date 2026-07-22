'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/ui/branding/Logo';

const RESEND_COOLDOWN_SECONDS = 60;

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  const sendResetLink = useCallback(async () => {
    setEmailError('');
    setServerError('');

    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }

    setIsLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    });
    setIsLoading(false);

    if (error) {
      setServerError(error.message);
      return false;
    }

    setSubmitted(true);
    setCooldown(RESEND_COOLDOWN_SECONDS);
    return true;
  }, [email]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await sendResetLink();
  }

  async function handleResend() {
    if (cooldown > 0 || isLoading) return;
    await sendResetLink();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background/80 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link href="/" aria-label="FreePeriod home">
            <Logo size="lg" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary">
              Recover password
            </h1>
            <p className="mt-1.5 font-body text-sm leading-relaxed text-text-secondary">
              Enter your email to receive a reset link
            </p>
          </div>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="space-y-5 p-6">
            {serverError && (
              <div role="alert" className="rounded-xl bg-error/10 p-3 text-center text-sm text-error">
                {serverError}
              </div>
            )}

            {submitted ? (
              <div className="space-y-4">
                <div
                  role="status"
                  className="rounded-xl bg-success/10 p-3 text-center text-sm text-success"
                >
                  Check your inbox — we&apos;ve sent a reset link to <strong>{email}</strong>
                </div>
                <p className="text-center font-body text-sm text-text-secondary">
                  Didn&apos;t get it? Check your spam folder, then resend if needed.
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={handleResend}
                  isLoading={isLoading}
                  disabled={cooldown > 0}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend reset link'}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={emailError}
                  autoComplete="email"
                />
                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Send Reset Link
                </Button>
              </form>
            )}

            <p className="text-center font-body text-sm text-text-secondary">
              Remembered your password?{' '}
              <Link href="/sign-in" className="font-semibold text-coral hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
