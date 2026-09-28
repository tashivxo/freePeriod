export function getTemplateExtension(templatePath: string | null | undefined): string {
  return templatePath?.split('.').pop()?.toLowerCase() ?? '';
}

export const FILLABLE_TEMPLATE_ACCEPT = '.docx,.xlsx,.xls';

export function isFillableTemplatePath(templatePath: string | null | undefined): boolean {
  const ext = getTemplateExtension(templatePath);
  return ext === 'docx' || ext === 'xlsx' || ext === 'xls';
}

export function getTemplateUploadError(templatePath: string): string {
  const ext = getTemplateExtension(templatePath);
  return `Only .docx, .xlsx, or .xls — you uploaded a ${ext ? `.${ext}` : 'file'}.`;
}
