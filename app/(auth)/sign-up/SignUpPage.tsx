'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { mapAuthError } from '@/lib/auth/map-auth-error';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/ui/branding/Logo';

export function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [serverError, setServerError] = useState('');
  const [termsError, setTermsError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    setTermsError(acceptedTerms ? '' : 'You must agree to the Terms of Service and Privacy Policy.');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && acceptedTerms;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError('');
    if (!validate() || authBusy) return;

    setAuthBusy(true);
    const supabase = createClient();
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      setServerError(mapAuthError(error.message));
      setAuthBusy(false);
      return;
    }

    // Email confirmation required — stay on page with in-card success
    if (!authData.session) {
      setCheckEmail(true);
      setAuthBusy(false);
      return;
    }

    // Create profile row immediately if session is available
    if (authData.user) {
      await supabase.from('users').insert({
        id: authData.user.id,
        email,
        name,
        default_subject: null,
        default_grade: null,
        default_curriculum: null,
      });

      const { data: profile } = await supabase
        .from('users')
        .select('onboarding_complete')
        .eq('id', authData.user.id)
        .maybeSingle();

      router.push(profile?.onboarding_complete ? '/dashboard' : '/onboarding');
      return;
    }

    router.push('/onboarding');
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
              Create your account
            </h1>
            <p className="mt-1.5 font-body text-sm leading-relaxed text-text-secondary">
              Start planning lessons with AI
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

        {checkEmail ? (
          <div role="status" className="space-y-4">
            <div className="p-3 rounded-xl bg-success/10 text-success text-sm text-center">
              Check your email — we&apos;ve sent a confirmation link to{' '}
              <strong>{email}</strong>
            </div>
            <p className="text-center text-sm font-body text-text-secondary">
              Already confirmed?{' '}
              <Link href="/sign-in" className="text-coral font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        ) : (
          <>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            autoComplete="name"
          />
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

          <div className="space-y-1.5">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-body text-text-secondary">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => {
                  setAcceptedTerms(e.target.checked);
                  if (e.target.checked) setTermsError('');
                }}
                className="h-5 w-5 shrink-0 rounded border-border text-coral focus:ring-coral"
              />
              <span>
                I agree to the{' '}
                <Link href="/terms" className="text-coral font-semibold hover:underline" target="_blank">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-coral font-semibold hover:underline" target="_blank">
                  Privacy Policy
                </Link>
              </span>
            </label>
            {termsError && (
              <p role="alert" className="px-1 text-sm text-error">
                {termsError}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" isLoading={authBusy}>
            Create account
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-text-secondary/20" />
          <span className="text-sm text-text-secondary">or</span>
          <div className="flex-1 h-px bg-text-secondary/20" />
        </div>

        <Button
          className="w-full"
          onClick={handleGoogleLogin}
          type="button"
          disabled={authBusy}
        >
          Continue with Google
        </Button>

        <p className="text-center text-xs font-body text-text-secondary">
          By continuing with Google, you agree to our{' '}
          <Link href="/terms" className="text-coral hover:underline">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-coral hover:underline">
            Privacy Policy
          </Link>
          .
        </p>

        <p className="text-center text-sm font-body text-text-secondary">
          Already have an account?{' '}
          <Link href="/sign-in" className="text-coral font-semibold hover:underline">
            Sign in
          </Link>
        </p>
          </>
        )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
