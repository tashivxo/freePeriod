'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { StatusScreen } from '@/components/layout/StatusScreen';
import { Button } from '@/components/ui/Button';
import { useT } from '@/providers/locale';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusScreen title={t('status.errorTitle')} body={t('status.errorBody')}>
      <Button onClick={reset}>{t('status.tryAgain')}</Button>
      <Button asChild variant="outline">
        <Link href="/">{t('status.backHome')}</Link>
      </Button>
    </StatusScreen>
  );
}
