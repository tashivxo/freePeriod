import { Suspense } from 'react';
import { UpdatePasswordPage } from '../update-password/UpdatePasswordPage';
import { AuthCardSkeleton } from '../AuthCardSkeleton';

export const metadata = { title: 'Reset Password — FreePeriod' };

/**
 * Alias for password recovery links shaped as `/reset-password?token=XYZ`.
 * Token validation happens via `/api/auth/validate-recovery` before the form renders.
 */
export default function Page() {
  return (
    <Suspense fallback={<AuthCardSkeleton />}>
      <UpdatePasswordPage />
    </Suspense>
  );
}
