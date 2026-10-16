/**
 * Helpers for converting LessonSection field values between their stored types
 * (string | string[] | object) and the plain-text / HTML strings used by the editor.
 */

export const EMPTY_DIFFERENTIATION_MESSAGE =
  'No differentiation suggestions for this lesson.';

const UL_ITEM = /^\s*[-*•]\s+(.*)$/;
const OL_ITEM = /^\s*\d+[.)]\s+(.*)$/;
const LIST_MARKER = /^\s*(?:[-*•]|\d+[.)])\s+/;

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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function stripListMarker(line: string): string {
  return line.replace(LIST_MARKER, '').trim();
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

function plainTextToHtml(text: string): string {
  if (!text) return '<p></p>';
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const parts: string[] = [];
  let i = 0;
  while (i < lines.length) {
    if (lines[i].trim() === '') {
      i += 1;
      continue;
    }
    if (UL_ITEM.test(lines[i])) {
      const items: string[] = [];
      while (i < lines.length && UL_ITEM.test(lines[i])) {
        items.push(lines[i].replace(UL_ITEM, '$1'));
        i += 1;
      }
      parts.push(
        `<ul>${items.map((item) => `<li><p>${escapeHtml(item)}</p></li>`).join('')}</ul>`,
      );
      continue;
    }
    if (OL_ITEM.test(lines[i])) {
      const items: string[] = [];
      while (i < lines.length && OL_ITEM.test(lines[i])) {
        items.push(lines[i].replace(OL_ITEM, '$1'));
        i += 1;
      }
      parts.push(
        `<ol>${items.map((item) => `<li><p>${escapeHtml(item)}</p></li>`).join('')}</ol>`,
      );
      continue;
    }
    const paraLines: string[] = [lines[i]];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !UL_ITEM.test(lines[i]) &&
      !OL_ITEM.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i += 1;
    }
    parts.push(`<p>${paraLines.map((line) => escapeHtml(line)).join('<br>')}</p>`);
  }
  return parts.join('') || '<p></p>';
}

/**
 * HTML for the lesson editor / view. Must round-trip with stripHtml so a
 * no-op save keeps paragraphs, line breaks, and lists.
 */
export function contentToEditorHtml(value: unknown): string {
  if (Array.isArray(value)) {
    const items = value.map((item) => String(item)).filter((item) => item.trim().length > 0);
    if (items.length === 0) return '<p></p>';
    return `<ul>${items.map((item) => `<li><p>${escapeHtml(item)}</p></li>`).join('')}</ul>`;
  }
  if (isRecord(value)) {
    const text = contentToString(value);
    if (!text) return '<p></p>';
    return `<p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>`;
  }
  return plainTextToHtml(typeof value === 'string' ? value : contentToString(value));
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
    const item = stripListMarker(line);
    if (!item) continue;
    if (current === 'extension') extension.push(item);
    else support.push(item);
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
    return text
      .split('\n')
      .map((line) => stripListMarker(line))
      .filter((line) => line.length > 0);
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

function listItemText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function replaceLists(html: string, tag: 'ul' | 'ol'): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'gi');
  return html.replace(re, (_match, inner: string) => {
    let index = 0;
    const items: string[] = [];
    const itemRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let itemMatch: RegExpExecArray | null = itemRe.exec(inner);
    while (itemMatch) {
      index += 1;
      const text = listItemText(itemMatch[1] ?? '');
      if (text) {
        items.push(tag === 'ol' ? `${index}. ${text}` : `- ${text}`);
      }
      itemMatch = itemRe.exec(inner);
    }
    return items.length > 0 ? `\n${items.join('\n')}\n` : '';
  });
}

function blockText(html: string): string {
  const decoded = decodeHtmlEntities(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<[^>]+>/g, ''),
  ).replace(/\u00a0/g, ' ');

  return decoded
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n\n(?=(?:[-*•] |\d+[.)] ))/g, '\n')
    .trim();
}

/**
 * Convert editor HTML to stored plain text, keeping paragraphs, line breaks,
 * and bullet / numbered lists.
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  let out = html;
  out = replaceLists(out, 'ol');
  out = replaceLists(out, 'ul');
  return blockText(out);
}
