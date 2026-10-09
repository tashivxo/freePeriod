/** Browser tab title when a lesson has no usable name. */
export const LESSON_DOCUMENT_TITLE_FALLBACK = 'Lesson | FreePeriod';

function firstNonEmptyTitle(
  ...candidates: Array<string | null | undefined>
): string | undefined {
  for (const candidate of candidates) {
    const trimmed = candidate?.trim() ?? '';
    if (trimmed.length > 0) return trimmed;
  }
  return undefined;
}

function contentTitle(content: unknown): string | undefined {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return undefined;
  const title = (content as { title?: unknown }).title;
  return typeof title === 'string' ? title : undefined;
}

/**
 * Lesson page document title: "<lesson title> | FreePeriod".
 * User-typed titles keep em dashes (U+2014) as-is.
 */
export function lessonDocumentTitle(
  ...candidates: Array<string | null | undefined>
): string {
  const title = firstNonEmptyTitle(...candidates);
  return title ? `${title} | FreePeriod` : LESSON_DOCUMENT_TITLE_FALLBACK;
}

export function lessonDocumentTitleFromPlan(lesson: {
  title?: string | null;
  content?: unknown;
} | null | undefined): string {
  return lessonDocumentTitle(contentTitle(lesson?.content), lesson?.title);
}
