import Link from 'next/link';
import { legalConfig } from '@/lib/legal/config';

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background py-8">
      <div className="mx-auto max-w-3xl px-6 text-center space-y-3">
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-body">
          <Link href="/privacy" className="text-text-secondary hover:text-text-primary transition-colors">
            Privacy Policy
          </Link>
          <span className="text-border" aria-hidden="true">
            ·
          </span>
          <Link href="/terms" className="text-text-secondary hover:text-text-primary transition-colors">
            Terms of Service
          </Link>
          <span className="text-border" aria-hidden="true">
            ·
          </span>
          <Link href="/pricing" className="text-text-secondary hover:text-text-primary transition-colors">
            Pricing
          </Link>
          <span className="text-border" aria-hidden="true">
            ·
          </span>
          <a
            href={`mailto:${legalConfig.contactEmail}`}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            Contact
          </a>
        </nav>
        <p className="font-body text-sm text-text-secondary">
          © {year} {legalConfig.serviceName}. Built for teachers, by teachers.
        </p>
      </div>
    </footer>
  );
}
