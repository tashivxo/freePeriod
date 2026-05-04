import { Suspense } from 'react';
import { ForgotPasswordPage } from './ForgotPasswordPage';

export const metadata = { title: 'Reset Password — FreePeriod' };

export default function Page() {
  return (
    <Suspense>
      <ForgotPasswordPage />
    </Suspense>
  );
}
