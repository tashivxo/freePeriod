import type { Metadata } from 'next';
import { LegalDocumentShell } from '@/components/legal/LegalDocumentShell';
import { TermsOfServiceContent, termsTableOfContents } from '@/components/legal/TermsOfServiceContent';
import { legalConfig } from '@/lib/legal/config';

export const metadata: Metadata = {
  title: 'Terms of Service — FreePeriod',
  description: 'Terms governing your use of FreePeriod, the AI lesson planning service for teachers.',
};

export default function TermsPage() {
  return (
    <LegalDocumentShell
      title="Terms of Service"
      effectiveDate={legalConfig.effectiveDate}
      tableOfContents={[...termsTableOfContents]}
    >
      <TermsOfServiceContent />
    </LegalDocumentShell>
  );
}
