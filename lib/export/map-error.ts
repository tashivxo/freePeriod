export const TEMPLATE_DOWNLOAD_FAILED_CODE = 'TEMPLATE_DOWNLOAD_FAILED';

export const TEMPLATE_DOWNLOAD_FAILED_ERROR =
  'Couldn’t download the filled template. Try again, or rename the lesson without special characters.';

const RUNTIME_ERROR = /TypeError|ByteString|Cannot convert argument|\n\s+at\s+/i;

export type TemplateExportErrorResponse = {
  error: string;
  code: string;
};

/**
 * Keep export failures safe and consistent with the API's `{ error, code }`
 * response shape. Runtime details belong in server logs, never in JSON sent
 * to teachers.
 */
export function mapTemplateExportError(error: unknown): TemplateExportErrorResponse {
  console.error('[fill-template] Export failed:', error);
  return {
    error: TEMPLATE_DOWNLOAD_FAILED_ERROR,
    code: TEMPLATE_DOWNLOAD_FAILED_CODE,
  };
}

export function isSafeExportErrorMessage(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const message = value.trim();
  return Boolean(message) && message.length <= 500 && !RUNTIME_ERROR.test(message);
}
