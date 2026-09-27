const STACK_HINT = /\n\s+at\s+/;

export type ExportErrorBody = {
  error?: unknown;
  code?: unknown;
};

/**
 * Teacher-facing export failure copy. Prefer the API `error` and append `code`
 * when the server sent one (for example TEMPLATE_UNFILLED). Never surface
 * stack traces.
 */
export function formatExportFailureMessage(
  body: ExportErrorBody | null | undefined,
  fallback: string,
): string {
  const error = readableExportError(body?.error);
  const code = readableExportCode(body?.code);

  if (error && code) return `${error} (${code})`;
  if (error) return error;
  if (code) return `${fallback} (${code})`;
  return fallback;
}

function readableExportError(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || STACK_HINT.test(trimmed) || trimmed.length > 500) return null;
  return trimmed;
}

function readableExportCode(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || !/^[A-Z0-9_]{1,64}$/.test(trimmed)) return null;
  return trimmed;
}
