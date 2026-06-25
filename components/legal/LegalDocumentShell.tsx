import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { MarketingFooter } from '@/components/legal/MarketingFooter';

export function LegalDocumentShell({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <Logo size="sm" />
          <Link
            href="/"
            className="text-sm font-body text-text-secondary hover:text-text-primary transition-colors"
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <header className="mb-10 border-b border-border pb-8">
          <h1 className="font-display text-3xl font-bold text-text-primary sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 font-body text-sm text-text-secondary">
            Last updated: {lastUpdated}
          </p>
        </header>

        <article className="legal-document space-y-8 font-body text-text-primary [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-text-primary [&_h2]:mt-10 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-6 [&_p]:text-text-secondary [&_p]:leading-relaxed [&_li]:text-text-secondary [&_li]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2 [&_a]:text-coral [&_a]:underline [&_a]:underline-offset-2">
          {children}
        </article>
      </main>

      <MarketingFooter />
    </div>
  );
}
