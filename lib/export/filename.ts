export function subjectSlug(subject: string | null | undefined): string {
  if (!subject?.trim()) return 'generic';

  const slug = subject
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return slug || 'generic';
}

export function buildExportFilename(subject: string | null | undefined): string {
  return `freeperiod_lesson_plan_${subjectSlug(subject)}.docx`;
}
