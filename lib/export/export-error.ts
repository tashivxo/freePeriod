import { TEMPLATE_UNFILLED_CODE, TEMPLATE_UNFILLED_ERROR } from '@/lib/export/fill-template-result';

const RUNTIME_ERROR = /TypeError|ByteString|Cannot convert argument|\n\s+at\s+/i;

export type ExportErrorBody = {
  error?: unknown;
  code?: unknown;
};

/** Shown when a filled-template download fails without a safe API message (including HTTP 500). */
export const FILLED_TEMPLATE_DOWNLOAD_MESSAGE =
  'Couldn’t download the filled template. Try again, or rename the lesson without special characters.';

/**
 * Teacher copy for fill-template failures. Uses the API `error` / `code` the
 * same way upload and generate do, and never returns a stack or TypeError.
 */
export function mapFillTemplateError(
  status: number,
  body: ExportErrorBody | null | undefined,
): string {
  if (body?.code === TEMPLATE_UNFILLED_CODE) return TEMPLATE_UNFILLED_ERROR;
  if (status >= 500) return FILLED_TEMPLATE_DOWNLOAD_MESSAGE;

  const safe = safeApiError(body?.error);
  return safe ?? FILLED_TEMPLATE_DOWNLOAD_MESSAGE;
}

/** Native DOCX export. A safe API `error` is shown as-is; runtime text is dropped. */
export function mapLessonExportError(
  body: ExportErrorBody | null | undefined,
  fallback: string,
): string {
  return safeApiError(body?.error) ?? fallback;
}

function safeApiError(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 500 || RUNTIME_ERROR.test(trimmed)) return null;
  return trimmed;
}
