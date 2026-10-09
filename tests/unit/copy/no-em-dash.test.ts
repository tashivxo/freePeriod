import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  WRITING_LESSON_PLAN_STATUS,
  WRITING_WAIT_MESSAGES,
} from '@/components/animations/GenerationScreen';
import * as FilledTemplateCopy from '@/features/lesson/components/filled-template-copy';
import { EMAIL_ALREADY_EXISTS } from '@/lib/auth/email';
import * as AuthTerms from '@/lib/auth/terms';
import * as ExportCopy from '@/lib/export/copy';
import { TEMPLATE_UNFILLED_NO_PDF_FIELDS_ERROR } from '@/lib/export/fill-template-result';
import * as FillTemplateResult from '@/lib/export/fill-template-result';
import * as ExportMapError from '@/lib/export/map-error';
import { getMessages, LOCALES } from '@/lib/i18n';
import * as StorageDownload from '@/lib/parse/storage-download';

const EM_DASH = '\u2014';
const PDF_NO_FIELDS_MESSAGE =
  'Couldn’t fill this PDF, it has no fillable form fields. Upload a Word (.docx) version of your template, or use Free Period template for a Free Period lesson plan.';

type CopyEntry = { path: string; text: string };

function collectStrings(value: unknown, pathLabel: string): CopyEntry[] {
  if (typeof value === 'string') {
    return [{ path: pathLabel, text: value }];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectStrings(item, `${pathLabel}[${index}]`));
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) => {
      if (typeof nested === 'function') return [];
      return collectStrings(nested, `${pathLabel}.${key}`);
    });
  }
  return [];
}

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function extractQuoted(source: string, pattern: RegExp): string[] {
  const texts: string[] = [];
  const global = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
  let match: RegExpExecArray | null;
  while ((match = global.exec(source))) {
    texts.push(match[2] ?? match[1] ?? '');
  }
  return texts;
}

function walkFiles(dir: string, suffix: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...walkFiles(full, suffix));
    } else if (entry.name.endsWith(suffix)) {
      found.push(full);
    }
  }
  return found;
}

function collectCopyConstants(): CopyEntry[] {
  return [
    ...collectStrings(ExportCopy, 'lib/export/copy'),
    ...collectStrings(FillTemplateResult, 'lib/export/fill-template-result'),
    ...collectStrings(ExportMapError, 'lib/export/map-error'),
    ...collectStrings(FilledTemplateCopy, 'features/lesson/components/filled-template-copy'),
    ...collectStrings(StorageDownload, 'lib/parse/storage-download'),
    ...collectStrings(AuthTerms, 'lib/auth/terms'),
    ...collectStrings({ EMAIL_ALREADY_EXISTS }, 'lib/auth/email'),
    ...collectStrings(WRITING_WAIT_MESSAGES, 'WRITING_WAIT_MESSAGES'),
    ...collectStrings(WRITING_LESSON_PLAN_STATUS, 'WRITING_LESSON_PLAN_STATUS'),
  ];
}

function collectLocaleCopy(): CopyEntry[] {
  return LOCALES.flatMap((locale) => collectStrings(getMessages(locale), `locale:${locale}`));
}

function collectGenerationErrorCopy(): CopyEntry[] {
  const file = path.join(process.cwd(), 'lib/generation/map-error.ts');
  const source = stripComments(readFileSync(file, 'utf8'));
  const quoted = extractQuoted(source, /(['"`])((?:\\.|.)*?)(\1)/);
  return quoted
    .filter((text) => text.length > 0)
    .map((text) => ({ path: 'lib/generation/map-error.ts', text }));
}

function collectApiErrorCopy(): CopyEntry[] {
  const apiRoot = path.join(process.cwd(), 'app/api');
  const files = walkFiles(apiRoot, 'route.ts');
  const errorLiteral = /\b(?:error\s*:|jsonError\s*\()\s*(['"`])((?:\\.|.)*?)(\1)/g;
  return files.flatMap((file) => {
    const source = stripComments(readFileSync(file, 'utf8'));
    const relative = path.relative(process.cwd(), file);
    return extractQuoted(source, errorLiteral).map((text) => ({ path: relative, text }));
  });
}

function emDashOffenders(entries: CopyEntry[]): string[] {
  return entries
    .filter(({ text }) => text.includes(EM_DASH))
    .map(({ path: copyPath, text }) => `${copyPath}: ${text}`);
}

describe('user-facing copy has no em dash (U+2014)', () => {
  it('includes every shipped locale in the scanner', () => {
    expect(LOCALES).toEqual(expect.arrayContaining(['en', 'ar', 'es', 'fr', 'zh-Hans']));
  });

  it('contains no U+2014 in copy constants, generation errors, API error copy, or locales', () => {
    const offenders = emDashOffenders([
      ...collectCopyConstants(),
      ...collectLocaleCopy(),
      ...collectGenerationErrorCopy(),
      ...collectApiErrorCopy(),
    ]);

    expect(offenders).toEqual([]);
  });

  it('uses the exact no-fields PDF message with a comma, not an em dash', () => {
    expect(TEMPLATE_UNFILLED_NO_PDF_FIELDS_ERROR).toBe(PDF_NO_FIELDS_MESSAGE);
    expect(TEMPLATE_UNFILLED_NO_PDF_FIELDS_ERROR).not.toContain(EM_DASH);
  });
});
