/**
 * Helpers for converting LessonSection field values between their stored types
 * (string | string[] | object) and the plain-text / HTML strings used by the editor.
 */

/**
 * Convert any section value to a plain string suitable for editing.
 * - string  → returned as-is
 * - array   → joined with newlines
 * - object  → JSON pretty-printed
 */
export function contentToString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.join('\n');
  return JSON.stringify(value, null, 2);
}

/**
 * Round-trip: convert an edited string back to the original field type.
 * - original was string  → return text directly
 * - original was array   → split on newlines, drop blank lines
 * - original was object  → try JSON.parse; fall back to raw string
 */
export function editTextToContent(text: string, original: unknown): unknown {
  if (typeof original === 'string') return text;
  if (Array.isArray(original)) {
    return text.split('\n').filter((line) => line.trim().length > 0);
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
