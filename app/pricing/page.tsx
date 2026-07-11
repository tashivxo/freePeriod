import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PricingClient } from '@/features/billing/components/PricingClient';

export const metadata: Metadata = {
  title: 'Pricing — FreePeriod',
  description: 'Simple, honest pricing for every classroom. Start free, upgrade when you\'re ready.',
};

export default function PricingPage() {
  return (
    <Suspense>
      <PricingClient />
    </Suspense>
  );
}
