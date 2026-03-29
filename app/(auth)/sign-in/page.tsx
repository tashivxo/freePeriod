import { Suspense } from 'react';
import { SignInPage } from './SignInPage';

export const metadata = {
  title: 'Sign In — FreePeriod',
};

export default function Page() {
  return (
    <Suspense>
      <SignInPage />
    </Suspense>
  );
}
