export const FILLABLE_TEMPLATE_ACCEPT = '.pdf,.docx,.xlsx,.xls';

const FILLABLE_TEMPLATE_EXTENSIONS = new Set(['pdf', 'docx', 'xlsx', 'xls']);
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

export function isPdfTemplateMime(mimeType: string | null | undefined): boolean {
  const mime = mimeType?.trim().toLowerCase() ?? '';
  return PDF_MIME_TYPES.has(mime) || mime.includes('pdf');
}

export function getTemplateUploadError(
  templatePath: string,
  mimeType?: string | null,
): string {
  const ext = getTemplateExtension(templatePath);
  const mime = mimeType?.trim().toLowerCase() ?? '';
  const uploaded = ext
    ? `.${ext}`
    : isPdfTemplateMime(mime)
      ? '.pdf'
      : 'file';
  return `Lesson plan templates need to be .pdf, .docx, .xlsx, or .xls so we can fill them in. You uploaded a ${uploaded}.`;
}

function isNonFillableTemplateMime(mimeType: string | null | undefined): boolean {
  const mime = mimeType?.trim().toLowerCase() ?? '';
  if (!mime || isPdfTemplateMime(mime)) return false;
  return mime.startsWith('image/') || mime.startsWith('text/');
}

/** Returns a reject message, or null when the file may be uploaded as a template. */
export function getTemplateFileRejection(file: TemplateFileLike): string | null {
  const name = file.name?.trim() ?? '';
  const mime = file.type?.trim() ?? '';
  if (isNonFillableTemplateMime(mime)) {
    return getTemplateUploadError(name, mime);
  }
  if (isPdfTemplateMime(mime) || isFillableTemplatePath(name)) {
    return null;
  }
  return getTemplateUploadError(name, mime);
}
