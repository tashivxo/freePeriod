import { TEMPLATE_UNFILLED_CODE } from '@/lib/export/fill-template-result';

const STACK_OR_RUNTIME = /TypeError|ByteString|Cannot convert argument|\n\s+at\s+/i;

export type ExportErrorBody = {
  error?: unknown;
  code?: unknown;
};

export type ExportFailureNotice = {
  message: string;
  detail: string | null;
};

export const FILLED_TEMPLATE_DOWNLOAD_MESSAGE =
  'Couldn’t download the filled template. Try again, or rename the lesson without special characters.';

export const FILLED_TEMPLATE_UNFILLED_MESSAGE =
  'Couldn’t fill this template — some sections didn’t map. Try the FreePeriod template, or re-upload yours.';

const LESSON_DOWNLOAD_MESSAGE = 'Couldn’t download this lesson. Try again.';

/**
 * Teacher-facing fill-template failure. The short line is always safe to show.
 * Status and code stay in `detail` for an optional Details disclosure.
 * Runtime exceptions and stack traces are dropped.
 */
export function describeFillTemplateFailure(
  status: number,
  body: ExportErrorBody | null | undefined,
): ExportFailureNotice {
  const code = readableExportCode(body?.code);
  const serverMessage = readableServerMessage(body?.error);

  if (status === 422 && code === TEMPLATE_UNFILLED_CODE) {
    return {
      message: FILLED_TEMPLATE_UNFILLED_MESSAGE,
      detail: formatTechnicalDetail(status, code),
    };
  }

  if (status >= 500) {
    return {
      message: FILLED_TEMPLATE_DOWNLOAD_MESSAGE,
      detail: formatTechnicalDetail(status, code, serverMessage),
    };
  }

  if (serverMessage) {
    return {
      message: serverMessage,
      detail: code ? formatTechnicalDetail(status, code) : null,
    };
  }

  return {
    message: FILLED_TEMPLATE_DOWNLOAD_MESSAGE,
    detail: formatTechnicalDetail(status, code),
  };
}

/** Native lesson DOCX export. A safe API message stays the headline. */
export function describeLessonExportFailure(
  status: number,
  body: ExportErrorBody | null | undefined,
): ExportFailureNotice {
  const code = readableExportCode(body?.code);
  const serverMessage = readableServerMessage(body?.error);

  if (serverMessage) {
    return {
      message: serverMessage,
      detail: code ? formatTechnicalDetail(status, code) : null,
    };
  }

  return {
    message: LESSON_DOWNLOAD_MESSAGE,
    detail: formatTechnicalDetail(status, code),
  };
}

function formatTechnicalDetail(
  status: number,
  code: string | null,
  serverMessage?: string | null,
): string | null {
  const parts = [`HTTP ${status}`];
  if (code) parts.push(code);
  const head = parts.join(' · ');
  if (serverMessage) return `${head}\n${serverMessage}`;
  return head;
}

function readableServerMessage(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 500 || STACK_OR_RUNTIME.test(trimmed)) return null;
  return trimmed;
}

function readableExportCode(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || !/^[A-Z0-9_]{1,64}$/.test(trimmed)) return null;
  return trimmed;
}
