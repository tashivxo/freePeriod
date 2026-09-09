'use client';

import Link from 'next/link';

import { LanguagePicker } from '@/components/ui/LanguagePicker';
import { TextSwap } from '@/components/ui/TextSwap';
import { Logo } from '@/components/ui/branding/Logo';
import { useLocale } from '@/providers/locale';

type MarketingHeaderProps = {
  navLink: {
    href: string;
    labelKey: string;
  };
  maxWidthClass?: string;
  showSignIn?: boolean;
};

export function MarketingHeader({
  navLink,
  maxWidthClass = 'max-w-5xl',
  showSignIn = true,
}: MarketingHeaderProps) {
  const { t, locale } = useLocale();

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div
        className={`mx-auto flex ${maxWidthClass} items-center justify-between gap-2 px-4 py-3 sm:px-6`}
      >
        <Link href="/" className="inline-flex min-h-11 shrink-0 items-center">
          <Logo size="sm" className="max-sm:gap-0 [&>span:last-child]:max-sm:hidden" />
        </Link>
        <nav className="flex min-w-0 shrink items-center justify-end gap-1.5 sm:gap-2">
          <LanguagePicker variant="icon" />
          <Link
            href={navLink.href}
            className="inline-flex min-h-11 items-center px-2 py-2 text-sm font-body text-text-secondary transition-colors hover:text-text-primary sm:px-3"
          >
            <TextSwap swapKey={locale}>{t(navLink.labelKey)}</TextSwap>
          </Link>
          {showSignIn ? (
            <Link
              href="/sign-in"
              className="relative btn-shine inline-flex min-h-11 items-center overflow-hidden whitespace-nowrap rounded-xl bg-coral px-2.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-coral-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral sm:px-4"
            >
              <TextSwap swapKey={locale}>{t('landing.headerSignIn')}</TextSwap>
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
