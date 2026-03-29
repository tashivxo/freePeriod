import type { Metadata } from 'next';
import { OnboardingPage } from './OnboardingPage';

export const metadata: Metadata = {
  title: 'Onboarding — FreePeriod',
};

export default function Page() {
  return <OnboardingPage />;
}
