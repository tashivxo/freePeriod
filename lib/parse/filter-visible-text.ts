/**
 * Remove characters that cannot be rendered as visible text and are commonly
 * used to hide instructions in otherwise normal-looking extracted content.
 *
 * Keep whitespace that carries document structure. In particular, do not
 * remove zero-width joiners because they can be meaningful in emoji and some
 * writing systems.
 */
export function removeNonVisibleCharacters(text: string): string {
  return text
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[\u200B\u200C\u200E\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF]/g, '');
}

export function cleanExtractedText(text: string): string {
  return removeNonVisibleCharacters(text).trim();
}
