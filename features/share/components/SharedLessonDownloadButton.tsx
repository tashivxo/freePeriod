'use client';

import { DownloadIcon } from '@/components/ui/icons/download';
import { MotionSafeIcon } from '@/components/ui/icons/MotionSafeIcon';
import { Button } from '@/components/ui/Button';
import { downloadBlob } from '@/lib/download-blob';
import { useT } from '@/providers/locale';

type SharedLessonDownloadButtonProps = {
  token: string;
  fileName: string;
};

export function SharedLessonDownloadButton({ token, fileName }: SharedLessonDownloadButtonProps) {
  const t = useT();

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={async () => {
        const response = await fetch(`/api/share/${token}/download`);
        if (!response.ok) return;
        downloadBlob(await response.blob(), fileName);
      }}
    >
      <MotionSafeIcon icon={DownloadIcon} size={20} className="me-2" parentHover parentFocus />
      {t('share.download')}
    </Button>
  );
}