type CurriculumAccuracyNoticeProps = {
  curriculum?: string | null;
};

export function CurriculumAccuracyNotice({ curriculum }: CurriculumAccuracyNoticeProps) {
  const curriculumLabel = curriculum?.trim() ? ` for ${curriculum.trim()}` : '';

  return (
    <div
      role="note"
      aria-label="Curriculum accuracy notice"
      className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-text-secondary"
    >
      <p className="font-body font-semibold text-text-primary">
        Curriculum alignment notice{curriculumLabel}
      </p>
      <p className="mt-1 font-body">
        FreePeriod provides AI-generated curriculum guidance, not verified curriculum compliance.
        Standards codes are only included when supported by an uploaded curriculum document.
        Verify the plan against your official requirements before an observation or submission.
      </p>
    </div>
  );
}
