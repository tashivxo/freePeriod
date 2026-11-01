const COLON = /[:\uff1a]/;
const MAX_LABEL_LENGTH = 80;

export type BoldLabelItem = { label: string; rest: string };

/**
 * A list item whose lead is a bold label ending in a colon, such as
 * "- **Prior knowledge:**" or "**Extension:** text". The model should not
 * return these, but when it does they must render as headings, not bullets.
 */
export function splitBoldLabelItem(item: string): BoldLabelItem | null {
  const match = item.match(/^\s*(?:[-*\u2022]\s+)?\*\*([^*\n]+)\*\*([\s\S]*)$/);
  if (!match) return null;
  const inner = match[1].trim();
  const tail = match[2];
  if (tail.includes('**')) return null;

  let label: string;
  let rest: string;
  if (COLON.test(inner.slice(-1))) {
    label = inner;
    rest = tail;
  } else if (COLON.test(tail.charAt(0))) {
    label = `${inner}${tail.charAt(0)}`;
    rest = tail.slice(1);
  } else {
    return null;
  }
  if (label.length > MAX_LABEL_LENGTH) return null;
  return { label, rest: rest.trim() };
}
