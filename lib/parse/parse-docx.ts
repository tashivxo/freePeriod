import JSZip from 'jszip';
import { cleanExtractedText } from './filter-visible-text';
import type { ParsedContent } from './types';

const FALSE_VALUES = new Set(['0', 'false', 'off', 'no']);

function getAttribute(attributes: string, name: string): string | undefined {
  const match = attributes.match(
    new RegExp(`(?:^|\\s)(?:[\\w-]+:)?${name}\\s*=\\s*["']([^"']*)["']`, 'i'),
  );
  return match?.[1];
}

function hasActiveFlag(runProperties: string, elementName: string): boolean {
  const match = runProperties.match(
    new RegExp(`<(?:[\\w-]+:)?${elementName}\\b([^>]*)\\/?>`, 'i'),
  );
  if (!match) return false;
  return !FALSE_VALUES.has((getAttribute(match[1], 'val') ?? '').toLowerCase());
}

function hasTinyFont(runProperties: string): boolean {
  const sizeTags = [...runProperties.matchAll(/<(?:[\w-]+:)?(?:sz|szCs)\b([^>]*)>/gi)];
  return sizeTags.some((tag) => {
    const value = Number.parseInt(getAttribute(tag[1], 'val') ?? '', 10);
    // OOXML font sizes are stored in half-points. Keep malformed/inherited
    // values because false positives are worse than retaining tiny text.
    return Number.isFinite(value) && value < 12;
  });
}

function isNearWhite(runProperties: string): boolean {
  const colorMatch = runProperties.match(/<(?:[\w-]+:)?color\b([^>]*)>/i);
  if (!colorMatch) return false;

  // Theme colors cannot be safely classified without resolving the document
  // theme, so retain them. "auto" is normally the document's foreground color.
  if (getAttribute(colorMatch[1], 'themeColor') || getAttribute(colorMatch[1], 'themeTint')) {
    return false;
  }

  const value = (getAttribute(colorMatch[1], 'val') ?? '').replace(/^#/, '');
  if (!/^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) return false;
  const expanded = value.length === 3 ? value.split('').map((part) => part + part).join('') : value;
  const channels = [0, 2, 4].map((index) => Number.parseInt(expanded.slice(index, index + 2), 16));

  // Only drop extremely pale colors. This intentionally leaves ordinary gray
  // footnotes intact rather than guessing at page/background colors.
  return channels.every((channel) => channel >= 248);
}

function decodeXmlText(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, value: string) =>
      String.fromCodePoint(Number.parseInt(value, 16)),
    )
    .replace(/&#(\d+);/g, (_, value: string) => String.fromCodePoint(Number.parseInt(value, 10)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function readVisibleRun(runXml: string): { text: string; dropped: boolean } {
  const properties = runXml.match(/<(?:[\w-]+:)?rPr\b[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?rPr>/i)?.[1] ?? '';
  const dropped =
    hasActiveFlag(properties, 'vanish') ||
    hasActiveFlag(properties, 'webHidden') ||
    hasTinyFont(properties) ||
    isNearWhite(properties);

  if (dropped) return { text: '', dropped: true };

  const tokens = /<(?:[\w-]+:)?t\b[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?t>|<(?:[\w-]+:)?(?:tab|br|cr)\b[^>]*\/?>/gi;
  let text = '';
  for (const token of runXml.matchAll(tokens)) {
    text += token[1] === undefined ? (token[0].toLowerCase().includes('tab') ? '\t' : '\n') : decodeXmlText(token[1]);
  }
  return { text, dropped: false };
}

/**
 * Extract visible paragraph text from WordprocessingML.
 *
 * This intentionally applies only explicit run-level signals. Resolving all
 * inherited character styles and theme colors would require reproducing much
 * of Word's rendering model and risks deleting legitimate curriculum text.
 */
export function filterDocxXml(xml: string): { text: string; droppedRunCount: number } {
  const paragraphs = [...xml.matchAll(/<(?:[\w-]+:)?p\b[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?p>/gi)];
  let droppedRunCount = 0;
  const text = paragraphs
    .map((paragraph) => {
      let paragraphText = '';
      for (const run of paragraph[1].matchAll(/<(?:[\w-]+:)?r\b[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?r>/gi)) {
        const result = readVisibleRun(run[1]);
        paragraphText += result.text;
        if (result.dropped) droppedRunCount += 1;
      }
      return paragraphText;
    })
    .join('\n');

  return { text: cleanExtractedText(text), droppedRunCount };
}

export async function parseDocx(buffer: Buffer): Promise<ParsedContent> {
  const zip = await JSZip.loadAsync(buffer);
  const documentXml = zip.file('word/document.xml');
  if (!documentXml) throw new Error('DOCX document.xml is missing');

  const result = filterDocxXml(await documentXml.async('string'));
  return {
    text: result.text,
    type: 'docx',
    metadata: {
      filteredHiddenText: result.droppedRunCount > 0,
      droppedRunCount: result.droppedRunCount,
    },
  };
}
