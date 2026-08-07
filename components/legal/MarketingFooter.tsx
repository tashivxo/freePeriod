'use client';

import Link from 'next/link';
import { legalConfig } from '@/lib/legal/config';
import { useT } from '@/providers/locale';

export function MarketingFooter() {
  const t = useT();
  const year = new Date().getFullYear();

  const links: { href: string; label: string; external?: boolean }[] = [
    { href: '/privacy', label: t('settings.privacyPolicy') },
    { href: '/terms', label: t('settings.termsOfService') },
    { href: '/pricing', label: t('landing.headerPricing') },
    { href: `mailto:${legalConfig.contactEmail}`, label: t('landing.footerContact'), external: true },
  ];

  return (
    <footer className="border-t border-border bg-background py-10">
      <div className="mx-auto max-w-3xl space-y-4 px-6 text-center">
        <nav
          aria-label={t('landing.footerNavAriaLabel')}
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-body"
        >
          {links.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                className="inline-flex min-h-11 items-center text-text-secondary transition-colors hover:text-text-primary"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex min-h-11 items-center text-text-secondary transition-colors hover:text-text-primary"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>
        <p className="font-body text-sm text-text-secondary">
          © {year} {legalConfig.serviceName}. {t('landing.footerTagline')}
        </p>
      </div>
    </footer>
  );
}
