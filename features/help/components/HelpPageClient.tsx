'use client';

import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { MarketingFooter } from '@/components/legal/MarketingFooter';
import { HelpFeedback } from '@/features/help/components/HelpFeedback';
import { useT } from '@/providers/locale';

const HELP_HEADING_ID = 'help-page-heading';

export type HelpPageClientProps = {
  signedIn: boolean;
  supportEmail: string;
  accountEmail?: string;
  userId?: string;
  plan?: string;
};

export function HelpPageClient({
  signedIn,
  supportEmail,
  accountEmail,
  userId,
  plan,
}: HelpPageClientProps) {
  const t = useT();

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader
        navLink={
          signedIn
            ? { href: '/dashboard', labelKey: 'help.backToDashboard' }
            : { href: '/', labelKey: 'landing.backToHome' }
        }
        maxWidthClass="max-w-3xl"
        showSignIn={!signedIn}
      />

      <main className="mx-auto max-w-3xl px-6 py-12">
        <header className="mb-8">
          <h1
            id={HELP_HEADING_ID}
            className="font-display text-3xl font-bold text-text-primary sm:text-4xl"
          >
            {t('help.title')}
          </h1>
          <p className="mt-2 max-w-[65ch] font-body text-base text-text-secondary">
            {t('help.description')}
          </p>
        </header>

        <HelpFeedback
          labelledBy={HELP_HEADING_ID}
          supportEmail={supportEmail}
          accountEmail={accountEmail}
          userId={userId}
          plan={plan}
        />
      </main>

      <MarketingFooter />
    </div>
  );
}
