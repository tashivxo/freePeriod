import { Suspense } from 'react';
import { UpdatePasswordPage } from './UpdatePasswordPage';
import { AuthCardSkeleton } from '../AuthCardSkeleton';

export const metadata = { title: 'Set New Password — FreePeriod' };

export default function Page() {
  return (
    <Suspense fallback={<AuthCardSkeleton />}>
      <UpdatePasswordPage />
    </Suspense>
  );
}
