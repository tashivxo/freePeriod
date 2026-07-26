'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { mapAuthError } from '@/lib/auth/map-auth-error';
import type { RecoveryValidationResult } from '@/lib/auth/validate-recovery';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/ui/branding/Logo';

function isExpiredSessionError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('session') ||
    lower.includes('expired') ||
    lower.includes('not authenticated') ||
    lower.includes('auth session missing') ||
    lower.includes('jwt')
  );
}

async function validateRecoveryWithApi(
  payload?: { token?: string; token_hash?: string },
): Promise<RecoveryValidationResult> {
  const response = await fetch('/api/auth/validate-recovery', {
    method: payload ? 'POST' : 'GET',
    headers: payload ? { 'Content-Type': 'application/json' } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
    credentials: 'include',
  });
  try {
    return (await response.json()) as RecoveryValidationResult;
  } catch {
    return { valid: false, reason: 'invalid' };
  }
}

export function UpdatePasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionMissing, setSessionMissing] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function establishRecoverySession() {
      const tokenParam =
        searchParams.get('token')?.trim() ||
        searchParams.get('token_hash')?.trim() ||
        '';

      // Query-token path (e.g. /reset-password?token=XYZ): validate against
      // Supabase Auth via the API before rendering the form.
      if (tokenParam) {
        const result = await validateRecoveryWithApi(
          searchParams.get('token_hash')
            ? { token_hash: tokenParam }
            : { token: tokenParam },
        );

        if (result.valid) {
          if (!cancelled) {
            setSessionMissing(false);
            setCheckingSession(false);
            const clean = new URL(window.location.href);
            clean.searchParams.delete('token');
            clean.searchParams.delete('token_hash');
            window.history.replaceState(null, '', clean.pathname + clean.search);
          }
          return;
        }

        // React Strict Mode (dev) remounts effects: the first verifyOtp consumes
        // the single-use token and sets cookies; the second call then looks
        // "expired". Accept an existing provider session in that case.
        const existing = await validateRecoveryWithApi();
        if (!cancelled) {
          setSessionMissing(!existing.valid);
          setCheckingSession(false);
        }
        return;
      }

      // Implicit recovery redirects leave tokens in the URL hash; the server
      // callback cannot see them. Persist them, then confirm with Auth getUser.
      if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
        const params = new URLSearchParams(window.location.hash.slice(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const hashType = params.get('type');
        if (accessToken && refreshToken && (hashType === 'recovery' || !hashType)) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
          if (error) {
            if (!cancelled) {
              setSessionMissing(true);
              setCheckingSession(false);
            }
            return;
          }
        }
      }

      // Always re-validate with the auth provider (getUser), not local JWT only.
      const result = await validateRecoveryWithApi();
      if (!cancelled) {
        setSessionMissing(!result.valid);
        setCheckingSession(false);
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      // Do not flip to "valid" from auth events alone when we still need
      // provider confirmation; only clear the form if the session disappears.
      if (event === 'SIGNED_OUT' && !session) {
        setSessionMissing(true);
        setCheckingSession(false);
      }
    });

    void establishRecoverySession();
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [searchParams]);

  function validate(): boolean {
    const newErrors: { password?: string; confirm?: string } = {};
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Must be at least 8 characters';
    if (!confirm) newErrors.confirm = 'Please confirm your password';
    else if (password !== confirm) newErrors.confirm = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setIsLoading(true);

    // Re-check provider session before accepting a password change.
    const status = await validateRecoveryWithApi();
    if (!status.valid) {
      setIsLoading(false);
      setSessionMissing(true);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);
    if (error) {
      if (isExpiredSessionError(error.message)) {
        setSessionMissing(true);
      }
      setServerError(mapAuthError(error.message));
      return;
    }
    router.push('/dashboard');
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
              Set new password
            </h1>
            <p className="mt-1.5 font-body text-sm leading-relaxed text-text-secondary">
              Choose a strong password for your account
            </p>
          </div>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="space-y-5 p-6">
            {checkingSession ? (
              <p className="text-center font-body text-sm text-text-secondary">Checking your reset link…</p>
            ) : sessionMissing ? (
              <div className="space-y-4">
                <div role="alert" className="rounded-xl bg-error/10 p-3 text-center text-sm text-error">
                  This reset link has expired or is no longer valid. Request a new one to continue.
                </div>
                <Link
                  href="/forgot-password"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-[transform,opacity] active:scale-[0.96] btn-shine"
                >
                  Request a new reset link
                </Link>
              </div>
            ) : (
              <>
                {serverError && (
                  <div role="alert" className="rounded-xl bg-error/10 p-3 text-center text-sm text-error">
                    {serverError}
                    {isExpiredSessionError(serverError) && (
                      <span className="mt-2 block">
                        <Link href="/forgot-password" className="font-semibold text-coral hover:underline">
                          Request a new reset link
                        </Link>
                      </span>
                    )}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div>
                    <Input
                      label="New password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      error={errors.password}
                      autoComplete="new-password"
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
                    {!errors.password && (
                      <p className="mt-1 px-1 text-sm text-text-secondary">
                        Must be at least 8 characters
                      </p>
                    )}
                  </div>

                  <Input
                    label="Confirm password"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    error={errors.confirm}
                    autoComplete="new-password"
                    endAdornment={
                      <button
                        type="button"
                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                        onClick={() => setShowConfirm((v) => !v)}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center text-text-secondary transition-colors hover:text-text-primary"
                      >
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    }
                  />

                  <Button type="submit" className="w-full" isLoading={isLoading}>
                    Set new password
                  </Button>
                </form>
              </>
            )}

            <p className="text-center font-body text-sm text-text-secondary">
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
