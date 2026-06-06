import type { LessonSection } from '@/types';
import { LESSON_SECTIONS } from '@/lib/lesson/sections';

export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

export function asStringList(value: string[] | undefined): string[] {
  return Array.isArray(value) ? value : [];
}

export function textOrEmpty(value: string | undefined): string {
  return value ?? '';
}

export type ExportBlock =
  | { type: 'optional-text'; heading: string; text: string }
  | { type: 'list'; heading: string; items: string[] }
  | { type: 'text'; heading: string; text: string }
  | { type: 'differentiation'; heading: string; support: string[]; extension: string[] };

export function buildExportBlocks(content: LessonSection): ExportBlock[] {
  const blocks: ExportBlock[] = [];

  for (const section of LESSON_SECTIONS) {
    if (section.key === 'title') continue;

    const heading = section.exportHeading;
    const value = content[section.key];

    switch (section.key) {
      case 'essentialQuestion':
        if (content.essentialQuestion) {
          blocks.push({ type: 'optional-text', heading, text: content.essentialQuestion });
        }
        break;
      case 'vocabulary':
        if (content.vocabulary?.length) {
          blocks.push({ type: 'list', heading, items: asStringList(content.vocabulary) });
        }
        break;
      case 'differentiation':
        blocks.push({
          type: 'differentiation',
          heading,
          support: asStringList(content.differentiation?.support),
          extension: asStringList(content.differentiation?.extension),
        });
        break;
      case 'hook':
      case 'plenary':
        blocks.push({ type: 'text', heading, text: textOrEmpty(value as string | undefined) });
        break;
      default:
        blocks.push({ type: 'list', heading, items: asStringList(value as string[] | undefined) });
        break;
    }
  }

  return blocks;
}
