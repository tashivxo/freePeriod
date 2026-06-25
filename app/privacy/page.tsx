import type { Metadata } from 'next';
import { LegalDocumentShell } from '@/components/legal/LegalDocumentShell';
import { PrivacyPolicyContent } from '@/components/legal/PrivacyPolicyContent';
import { legalConfig } from '@/lib/legal/config';

export const metadata: Metadata = {
  title: 'Privacy Policy — FreePeriod',
  description:
    'How FreePeriod collects, uses, and protects your personal information. POPIA and GDPR aligned.',
};

export default function PrivacyPage() {
  return (
    <LegalDocumentShell title="Privacy Policy" lastUpdated={legalConfig.effectiveDate}>
      <PrivacyPolicyContent />
    </LegalDocumentShell>
  );
}
