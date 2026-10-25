'use client';

import Link from 'next/link';
import { StatusScreen } from '@/components/layout/StatusScreen';
import { Button } from '@/components/ui/Button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useT } from '@/providers/locale';

export function NotFoundView() {
  const t = useT();
  useDocumentTitle(t('status.notFoundDocumentTitle'));

  return (
    <StatusScreen code="404" title={t('status.notFoundTitle')} body={t('status.notFoundBody')}>
      <Button asChild>
        <Link href="/">{t('status.backHome')}</Link>
      </Button>
    </StatusScreen>
  );
}
