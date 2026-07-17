import Link from 'next/link';
import { legalConfig } from '@/lib/legal/config';

export function MarketingFooter() {
  const year = new Date().getFullYear();

  const links: { href: string; label: string; external?: boolean }[] = [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
    { href: '/pricing', label: 'Pricing' },
    { href: `mailto:${legalConfig.contactEmail}`, label: 'Contact', external: true },
  ];

  return (
    <footer className="border-t border-border bg-background py-10">
      <div className="mx-auto max-w-3xl space-y-4 px-6 text-center">
        <nav
          aria-label="Legal and support"
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
          © {year} {legalConfig.serviceName}. Built for teachers, by teachers.
        </p>
      </div>
    </footer>
  );
}
