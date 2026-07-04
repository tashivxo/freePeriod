'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';

export function ForgotPasswordPage() {
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7810/ingest/5fe91cc7-a83e-4a00-85c2-1d832e7eebd5', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '5467ae' },
      body: JSON.stringify({
        sessionId: '5467ae',
        runId: 'post-fix',
        hypothesisId: 'E',
        location: 'ForgotPasswordPage.tsx:mount',
        message: 'ForgotPasswordPage mounted',
        data: { path: typeof window !== 'undefined' ? window.location.pathname : 'ssr' },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }, []);
  // #endregion

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEmailError('');
    setServerError('');

    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    });
    setIsLoading(false);

    if (error) {
      setServerError(error.message);
      return;
    }

    setSubmitted(true);
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-background px-4 py-16 md:py-32">
      <div className="m-auto h-fit w-full max-w-sm overflow-hidden rounded-2xl border border-border shadow-md shadow-zinc-950/5">

        {/* Main card body */}
        <div className="bg-surface -m-px rounded-2xl border border-border/60 p-8 pb-6">

          {/* Logo + heading */}
          <div>
            <Link href="/" aria-label="go home">
              <Logo size="md" />
            </Link>
            <h1 className="mt-4 mb-1 text-xl font-display font-semibold text-text-primary">
              Recover Password
            </h1>
            <p className="font-body text-sm text-text-secondary">
              Enter your email to receive a reset link
            </p>
          </div>

          {serverError && (
            <div role="alert" className="mt-4 p-3 rounded-xl bg-error/10 text-error text-sm text-center">
              {serverError}
            </div>
          )}

          {submitted ? (
            <div className="mt-6 space-y-4">
              <div role="status" className="p-3 rounded-xl bg-success/10 text-success text-sm text-center">
                Check your inbox — we&apos;ve sent a reset link to <strong>{email}</strong>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
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

              <p className="font-body text-center text-sm text-text-secondary">
                We&apos;ll send you a link to reset your password.
              </p>
            </div>
          )}
        </div>

        {/* Footer strip */}
        <div className="px-8 py-4">
          <p className="font-body text-center text-sm text-text-secondary">
            Remembered your password?{' '}
            <Link href="/sign-in" className="text-coral font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>

      </div>
    </section>
  );
}
