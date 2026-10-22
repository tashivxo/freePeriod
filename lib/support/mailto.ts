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

/** Keeps the mailto: link short enough for desktop mail clients that cap URL length. */
export const SUPPORT_MESSAGE_MAX_LENGTH = 1000;
const SUBJECT_SNIPPET_LENGTH = 60;

export type SupportDiagnostics = {
  email: string;
  userId: string;
  plan: string;
  locale: string;
  page: string;
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
  const firstLine = message.trim().split(/\r?\n/, 1)[0]!.replace(/\s+/g, ' ');
  return firstLine.length > SUBJECT_SNIPPET_LENGTH
    ? `${firstLine.slice(0, SUBJECT_SNIPPET_LENGTH - 3).trimEnd()}...`
    : firstLine;
}

export function buildSupportEmail({ to, category, message, plan, diagnostics }: SupportEmailInput) {
  const trimmed = message.trim().slice(0, SUPPORT_MESSAGE_MAX_LENGTH);
  const subject = `[FreePeriod][${CATEGORY_TAGS[category]}][${plan}] ${subjectSnippet(trimmed)}`;

  // RFC 6068: line breaks in a mailto body are CRLF, including the teacher's own.
  const lines = [trimmed.replace(/\r?\n/g, '\r\n')];
  if (diagnostics) {
    lines.push(
      '',
      '---',
      `Category: ${CATEGORY_TAGS[category]}`,
      `Account: ${diagnostics.email}`,
      `User ID: ${diagnostics.userId}`,
      `Plan: ${diagnostics.plan}`,
      `Language: ${diagnostics.locale}`,
      `Page: ${diagnostics.page}`,
      `Browser: ${diagnostics.browser}`,
      `Sent: ${diagnostics.sentAt}`,
    );
  }
  const body = lines.join('\r\n');

  return {
    subject,
    body,
    href: `mailto:${encodeURIComponent(to).replace(/%40/g, '@')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
  };
}
