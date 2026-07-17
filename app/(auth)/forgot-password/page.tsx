import { Suspense } from 'react';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { AuthCardSkeleton } from '../AuthCardSkeleton';

export const metadata = { title: 'Reset Password — FreePeriod' };

export default function Page() {
  return (
    <Suspense fallback={<AuthCardSkeleton />}>
      <ForgotPasswordPage />
    </Suspense>
  );
}
