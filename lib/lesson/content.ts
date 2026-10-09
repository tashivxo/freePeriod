/**
 * Helpers for converting LessonSection field values between their stored types
 * (string | string[] | object) and the plain-text / HTML strings used by the editor.
 */

export const EMPTY_DIFFERENTIATION_MESSAGE =
  'No differentiation suggestions for this lesson.';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

export function nonEmptyListItems(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => String(item).trim()).filter((item) => item.length > 0);
}

export function isDifferentiationShape(value: unknown): boolean {
  return isRecord(value) && ('support' in value || 'extension' in value);
}

function recordHasVisibleListItems(value: Record<string, unknown>): boolean {
  return Object.values(value).some((nested) => nonEmptyListItems(nested).length > 0);
}

/**
 * Convert any section value to a plain string suitable for editing.
 * - string  → returned as-is
 * - array   → joined with newlines
 * - object with no filled lists → empty string (never raw JSON)
 * - object  → JSON pretty-printed
 */
export function contentToString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.join('\n');
  if (isRecord(value) && !recordHasVisibleListItems(value)) return '';
  return JSON.stringify(value, null, 2) ?? '';
}

function parseDifferentiationText(text: string): { support: string[]; extension: string[] } {
  const trimmed = text.trim();
  if (!trimmed) return { support: [], extension: [] };

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (isRecord(parsed)) {
      return {
        support: nonEmptyListItems(parsed.support),
        extension: nonEmptyListItems(parsed.extension),
      };
    }
  } catch {
    // Teacher-edited plain text, not JSON
  }

  const support: string[] = [];
  const extension: string[] = [];
  let current: 'support' | 'extension' | null = null;
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^support:?$/i.test(line)) {
      current = 'support';
      continue;
    }
    if (/^extension:?$/i.test(line)) {
      current = 'extension';
      continue;
    }
    if (current === 'extension') extension.push(line);
    else support.push(line);
  }
  return { support, extension };
}

/**
 * Round-trip: convert an edited string back to the original field type.
 * - original was string  → return text directly
 * - original was array   → split on newlines, drop blank lines
 * - original was differentiation object → JSON or labeled Support/Extension text
 * - original was object  → try JSON.parse; fall back to raw string
 */
export function editTextToContent(text: string, original: unknown): unknown {
  if (typeof original === 'string') return text;
  if (Array.isArray(original)) {
    return text.split('\n').filter((line) => line.trim().length > 0);
  }
  if (isDifferentiationShape(original)) {
    return parseDifferentiationText(text);
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Strip all HTML tags from a string.
 * Used before persisting HTML editor output to the database.
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}
