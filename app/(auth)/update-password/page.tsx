import { Suspense } from 'react';
import { UpdatePasswordPage } from './UpdatePasswordPage';

export const metadata = { title: 'Set New Password — FreePeriod' };

export default function Page() {
  return (
    <Suspense>
      <UpdatePasswordPage />
    </Suspense>
  );
}
