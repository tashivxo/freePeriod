/** Matches the longest title the generator produces; keeps cards readable. */
export const LESSON_TITLE_MAX_LENGTH = 200;

export type ParsedLessonTitle =
  | { ok: true; title: string }
  | { ok: false; reason: 'missing' | 'invalid' };

export function parseLessonTitle(value: unknown): ParsedLessonTitle {
  if (value === undefined || value === null) {
    return { ok: false, reason: 'missing' };
  }
  if (typeof value !== 'string') {
    return { ok: false, reason: 'invalid' };
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { ok: false, reason: 'missing' };
  }
  const title =
    trimmed.length > LESSON_TITLE_MAX_LENGTH
      ? trimmed.slice(0, LESSON_TITLE_MAX_LENGTH)
      : trimmed;
  return { ok: true, title };
}