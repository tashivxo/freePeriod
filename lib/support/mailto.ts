/**
 * Builds the pre-filled support email behind Settings → Help & feedback.
 *
 * v1 hands the message to the teacher's own email app (mailto:), so nothing is sent
 * from our servers and no email provider key is needed. Diagnostics are labelled in
 * English for the support inbox; the teacher's message stays in their own language.
 */

export const SUPPORT_CATEGORIES = ['bug', 'idea', 'billing', 'account'] as const;
export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

/** Subject tags support filters on, kept in English whatever the UI language. */
const CATEGORY_TAGS: Record<SupportCategory, string> = {
  bug: 'Bug',
  idea: 'Idea',
  billing: 'Billing',
  account: 'Account',
};

/** Typing limit for the message box. */
export const SUPPORT_MESSAGE_MAX_LENGTH = 1000;
/**
 * Some desktop mail clients (Outlook on Windows) and Android handlers drop mailto: links
 * past ~2,000 characters. Measured on the encoded link, because Arabic or Chinese text
 * grows 6-9x when percent-encoded.
 */
export const SUPPORT_MAILTO_MAX_LENGTH = 1900;
const SHORTENED_NOTE = '[Message shortened to fit an email link. The sender can paste the full text.]';
const SUBJECT_SNIPPET_LENGTH = 60;

export type SupportDiagnostics = {
  email: string;
  userId: string;
  plan: string;
  locale: string;
  browser: string;
  sentAt: string;
};

export type SupportEmailInput = {
  to: string;
  category: SupportCategory;
  message: string;
  plan: string;
  /** Omitted when the teacher unticks "Include account and browser details". */
  diagnostics?: SupportDiagnostics;
};

function subjectSnippet(message: string): string {
  const firstLine = Array.from(message.trim().split(/\r?\n/, 1)[0]!.replace(/\s+/g, ' '));
  return firstLine.length > SUBJECT_SNIPPET_LENGTH
    ? `${firstLine.slice(0, SUBJECT_SNIPPET_LENGTH - 3).join('').trimEnd()}...`
    : firstLine.join('');
}

function composeBody(message: string, category: SupportCategory, diagnostics?: SupportDiagnostics) {
  // RFC 6068: line breaks in a mailto body are CRLF, including the teacher's own.
  const lines = [message.replace(/\r?\n/g, '\r\n')];
  if (diagnostics) {
    lines.push(
      '',
      '---',
      `Category: ${CATEGORY_TAGS[category]}`,
      `Account: ${diagnostics.email}`,
      `User ID: ${diagnostics.userId}`,
      `Plan: ${diagnostics.plan}`,
      `Language: ${diagnostics.locale}`,
      `Browser: ${diagnostics.browser}`,
      `Sent: ${diagnostics.sentAt}`,
    );
  }
  return lines.join('\r\n');
}

/**
 * `body` is always the full draft (for Copy message). `href` carries the same draft, or a
 * shortened message with a note when the encoded link would be too long; `shortened` says so.
 */
export function buildSupportEmail({ to, category, message, plan, diagnostics }: SupportEmailInput) {
  // Cut by code point: half an emoji makes encodeURIComponent throw.
  const trimmed = Array.from(message.trim()).slice(0, SUPPORT_MESSAGE_MAX_LENGTH).join('');
  const subject = `[FreePeriod][${CATEGORY_TAGS[category]}][${plan}] ${subjectSnippet(trimmed)}`;
  const body = composeBody(trimmed, category, diagnostics);
  const linkFor = (draft: string) =>
    `mailto:${encodeURIComponent(to).replace(/%40/g, '@')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(draft)}`;

  let href = linkFor(body);
  let shortened = false;
  // Array.from splits by code point, so emoji and other astral characters are never cut in half.
  const chars = Array.from(trimmed);
  let keep = chars.length;
  while (href.length > SUPPORT_MAILTO_MAX_LENGTH && keep > 0) {
    keep = Math.floor(keep * 0.85);
    shortened = true;
    const partial = `${chars.slice(0, keep).join('').trimEnd()}...\n\n${SHORTENED_NOTE}`;
    href = linkFor(composeBody(partial, category, diagnostics));
  }

  return { subject, body, href, shortened };
}
