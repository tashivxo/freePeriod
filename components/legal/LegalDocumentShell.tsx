import Link from 'next/link';
import { Logo } from '@/components/ui/branding/Logo';
import { MarketingFooter } from '@/components/legal/MarketingFooter';

export type LegalTableOfContentsItem = {
  id: string;
  title: string;
};

export function LegalDocumentShell({
  title,
  effectiveDate,
  tableOfContents,
  children,
}: {
  title: string;
  effectiveDate: string;
  tableOfContents?: LegalTableOfContentsItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <Logo size="sm" />
          <Link
            href="/"
            className="inline-flex min-h-11 items-center text-sm font-body text-text-secondary transition-colors hover:text-text-primary"
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
            Effective date: {effectiveDate}
          </p>
        </header>

        <article className="legal-document space-y-8 font-body text-text-primary [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-text-primary [&_h2]:mt-10 [&_h2]:scroll-mt-24 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:text-text-primary [&_p]:text-text-primary [&_p]:leading-relaxed [&_li]:text-text-primary [&_li]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2 [&_a]:text-coral [&_a]:underline [&_a]:underline-offset-2">
          {tableOfContents && tableOfContents.length > 0 && (
            <nav aria-label="Table of contents" className="mb-2 rounded-xl border border-border bg-surface/50 p-4">
              <h2 className="mb-3 font-display text-sm font-semibold text-text-primary">
                On this page
              </h2>
              <ul className="space-y-1">
                {tableOfContents.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="inline-flex min-h-11 items-center text-sm font-body text-coral transition-colors hover:underline"
                    >
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          {children}
        </article>
      </main>

      <MarketingFooter />
    </div>
  );
}
