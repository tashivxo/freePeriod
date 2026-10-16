'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { AuthBackground } from '@/components/animations/AuthBackground';
import { Logo } from '@/components/ui/branding/Logo';
import { Card, CardContent } from '@/components/ui/card';

/** Shared shell for the 404 and error pages: the sign-in look (waves, logo, one card). */
export function StatusScreen({
  code,
  title,
  body,
  children,
}: {
  code?: string;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <AuthBackground />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="mb-8 flex justify-center">
            <Link
              href="/"
              className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/40"
            >
              <Logo size="lg" />
            </Link>
          </div>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-8 text-center">
              {code && (
                <p className="mb-2 font-display text-6xl font-bold tracking-tight text-coral" aria-hidden="true">
                  {code}
                </p>
              )}
              <h1 className="mb-3 font-display text-2xl font-bold text-text-primary">{title}</h1>
              <p className="mb-8 font-body text-base leading-relaxed text-text-secondary">{body}</p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">{children}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
