'use client';

import { useT } from '@/providers/locale';

type CurriculumAccuracyNoticeProps = {
  curriculum?: string | null;
};

export function CurriculumAccuracyNotice({ curriculum }: CurriculumAccuracyNoticeProps) {
  const t = useT();
  const trimmed = curriculum?.trim() ?? '';
  const title = trimmed
    ? t('generate.alignmentTitleFor', { curriculum: trimmed })
    : t('generate.alignmentTitle');

  return (
    <div
      role="note"
      aria-label={t('generate.alignmentAria')}
      className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-text-secondary"
    >
      <p className="font-body font-semibold text-text-primary">{title}</p>
      <p className="mt-1 font-body">{t('generate.alignmentBody')}</p>
    </div>
  );
}
