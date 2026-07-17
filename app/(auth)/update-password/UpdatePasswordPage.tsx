'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/ui/Logo';

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

export function UpdatePasswordPage() {
  const router = useRouter();
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
    async function checkSession() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!cancelled) {
        setSessionMissing(!session);
        setCheckingSession(false);
      }
    }
    void checkSession();
    return () => {
      cancelled = true;
    };
  }, []);

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
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);
    if (error) {
      if (isExpiredSessionError(error.message)) {
        setSessionMissing(true);
      }
      setServerError(error.message);
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
                          className="p-1 text-text-secondary transition-colors hover:text-text-primary"
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
                        className="p-1 text-text-secondary transition-colors hover:text-text-primary"
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
