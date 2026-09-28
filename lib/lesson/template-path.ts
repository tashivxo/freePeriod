export const FILLABLE_TEMPLATE_ACCEPT = '.docx,.xlsx,.xls';

const FILLABLE_TEMPLATE_EXTENSIONS = new Set(['docx', 'xlsx', 'xls']);
const PDF_MIME_TYPES = new Set(['application/pdf', 'application/x-pdf']);

export type TemplateFileLike = {
  name?: string | null;
  type?: string | null;
};

export function getTemplateExtension(templatePath: string | null | undefined): string {
  const cleaned = templatePath?.split(/[?#]/)[0]?.trim() ?? '';
  if (!cleaned) return '';
  const fileName = cleaned.split(/[\\/]/).pop() ?? '';
  const dot = fileName.lastIndexOf('.');
  if (dot <= 0 || dot === fileName.length - 1) return '';
  return fileName.slice(dot + 1).toLowerCase();
}

export function isFillableTemplatePath(templatePath: string | null | undefined): boolean {
  return FILLABLE_TEMPLATE_EXTENSIONS.has(getTemplateExtension(templatePath));
}

export function isTemplateStoragePath(storagePath: string | null | undefined): boolean {
  return /(?:^|\/)template\//i.test(storagePath?.trim() ?? '');
}

export function getTemplateUploadError(
  templatePath: string,
  mimeType?: string | null,
): string {
  const ext = getTemplateExtension(templatePath);
  if (ext) return `Only .docx, .xlsx, or .xls — you uploaded a .${ext}.`;
  const mime = mimeType?.trim().toLowerCase() ?? '';
  if (PDF_MIME_TYPES.has(mime) || mime.includes('pdf')) {
    return 'Only .docx, .xlsx, or .xls — you uploaded a .pdf.';
  }
  return 'Only .docx, .xlsx, or .xls — you uploaded a file.';
}

function isNonFillableTemplateMime(mimeType: string | null | undefined): boolean {
  const mime = mimeType?.trim().toLowerCase() ?? '';
  if (!mime) return false;
  return (
    PDF_MIME_TYPES.has(mime) ||
    mime.includes('pdf') ||
    mime.startsWith('image/') ||
    mime.startsWith('text/')
  );
}

/** Returns a reject message, or null when the file may be uploaded as a template. */
export function getTemplateFileRejection(file: TemplateFileLike): string | null {
  const name = file.name?.trim() ?? '';
  const mime = file.type?.trim() ?? '';
  if (isNonFillableTemplateMime(mime) || !isFillableTemplatePath(name)) {
    return getTemplateUploadError(name, mime);
  }
  return null;
}
