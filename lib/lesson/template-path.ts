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
