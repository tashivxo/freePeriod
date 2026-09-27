export function getTemplateExtension(templatePath: string | null | undefined): string {
  return templatePath?.split('.').pop()?.toLowerCase() ?? '';
}

export function isFillableTemplatePath(templatePath: string | null | undefined): boolean {
  const ext = getTemplateExtension(templatePath);
  return ext === 'docx' || ext === 'xlsx' || ext === 'xls';
}

export function isPdfTemplatePath(templatePath: string | null | undefined): boolean {
  return getTemplateExtension(templatePath) === 'pdf';
}

/** How an attached file can be used by Fill my template. */
export type TemplateAttachmentKind = 'none' | 'fillable' | 'pdf' | 'other';

export function getTemplateAttachmentKind(
  templatePath: string | null | undefined,
): TemplateAttachmentKind {
  const path = templatePath?.trim();
  if (!path) return 'none';
  if (isFillableTemplatePath(path)) return 'fillable';
  if (isPdfTemplatePath(path)) return 'pdf';
  return 'other';
}
