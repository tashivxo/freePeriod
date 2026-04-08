'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/ui/Logo';

export function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setIsLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });
    setIsLoading(false);

    if (error) {
      setServerError(error.message);
      return;
    }

    router.push('/dashboard');
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
              Create your account
            </h1>
            <p className="mt-1 font-body text-sm text-text-secondary">
              Start planning lessons with AI
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
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="new-password"
          />

          <Button type="submit" className="w-full" isLoading={isLoading}>
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
        >
          Continue with Google
        </Button>

        <p className="text-center text-sm font-body text-text-secondary">
          Already have an account?{' '}
          <Link href="/sign-in" className="text-coral font-semibold hover:underline">
            Sign in
          </Link>
        </p>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
