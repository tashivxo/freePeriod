'use client';

import Link from 'next/link';
import { StatusScreen } from '@/components/layout/StatusScreen';
import { Button } from '@/components/ui/Button';
import { useT } from '@/providers/locale';

export default function NotFound() {
  const t = useT();
  return (
    <StatusScreen code="404" title={t('status.notFoundTitle')} body={t('status.notFoundBody')}>
      <Button asChild>
        <Link href="/">{t('status.backHome')}</Link>
      </Button>
    </StatusScreen>
  );
}
