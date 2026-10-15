/**
 * @jest-environment node
 *
 * Asserts the glyph order actually painted in appearance streams (Tj/TJ
 * decoded through the font ToUnicode map). Field getText() is logical and
 * is not enough: a second bidi pass at encode time can reverse the drawn
 * glyphs while leaving the stored value correct.
 */
import { inflateSync } from 'node:zlib';
import { PDFDocument } from 'pdf-lib';
import { fillGenericPdfTemplate } from '@/lib/export/fill-generic-pdf';
import type { LessonPlan } from '@/types';

const sampleLesson: LessonPlan = {
  id: 'test-id',
  user_id: 'user-id',
  title: 'Exploring States of Matter',
  subject: 'Science',
  grade: '6',
  curriculum: 'NGSS',
  duration_minutes: 60,
  model_used: 'test',
  token_count: 0,
  template_path: null,
  created_at: '',
  updated_at: '',
  content: {
    title: 'Exploring States of Matter',
    essentialQuestion: 'How do changes in thermal energy affect the state of matter?',
    objectives: ['Students will develop a model that predicts and describes changes in particle motion.'],
    successCriteria: ['I can explain how particle motion changes during melting and freezing'],
    priorKnowledge: ['All matter is made of particles that are constantly in motion.'],
    performanceExpectations: ['MS-PS1-4'],
    misconceptions: ['Students often think particles stop moving in a solid.'],
    sciencePractices: ['Developing and using models'],
    keyConcepts: ['Particle motion increases with thermal energy.'],
    vocabulary: ['Phase — a distinct form of matter such as solid, liquid, or gas'],
    hook: 'Demo ice melting while students predict particle motion.',
    mainActivities: ['Model particle diagrams on whiteboards.'],
    guidedPractice: ['Complete practice diagrams with circulating prompts.'],
    independentPractice: ['Annotate a heating curve independently.'],
    formativeAssessment: ['Exit ticket describing particle changes during evaporation'],
    differentiation: {
      support: ['Provide annotated particle diagrams'],
      extension: ['Research sublimation examples'],
    },
    realWorldConnections: ['Water cycle and weather patterns'],
    plenary: 'Share one insight about melting versus freezing.',
  },
};

async function makePdfWithFields(
  fields: Array<{ name: string; multiline?: boolean; width?: number; height?: number }>,
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const form = pdfDoc.getForm();
  let y = 720;
  for (const field of fields) {
    const textField = form.createTextField(field.name);
    if (field.multiline) textField.enableMultiline();
    const height = field.height ?? (field.multiline ? 80 : 24);
    textField.addToPage(page, {
      x: 50,
      y,
      width: field.width ?? 500,
      height,
    });
    y -= height + 20;
  }
  return Buffer.from(await pdfDoc.save());
}

function inflatePdfStreams(buffer: Buffer): string[] {
  const raw = buffer.toString('latin1');
  const streams: string[] = [];
  const re = /stream\r?\n/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(raw))) {
    const start = match.index + match[0].length;
    const end = raw.indexOf('endstream', start);
    if (end < 0) continue;
    let chunk = Buffer.from(raw.slice(start, end), 'latin1');
    if (chunk.subarray(-2).toString() === '\r\n') chunk = chunk.subarray(0, -2);
    else if (chunk.subarray(-1).toString() === '\n') chunk = chunk.subarray(0, -1);
    try {
      streams.push(inflateSync(chunk).toString('latin1'));
    } catch {
      streams.push(chunk.toString('latin1'));
    }
  }
  return streams;
}

function parseToUnicodeMap(streams: string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const stream of streams) {
    if (!stream.includes('beginbfchar')) continue;
    const pair = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g;
    let found: RegExpExecArray | null;
    while ((found = pair.exec(stream))) {
      const gid = found[1].toLowerCase().padStart(4, '0');
      const hex = found[2];
      let chars = '';
      for (let i = 0; i < hex.length; i += 4) {
        chars += String.fromCharCode(Number.parseInt(hex.slice(i, i + 4), 16));
      }
      map.set(gid, chars);
    }
  }
  return map;
}

function decodeTjHex(hex: string, cmap: Map<string, string>): string {
  const clean = hex.replace(/\s+/g, '');
  let out = '';
  for (let i = 0; i + 4 <= clean.length; i += 4) {
    out += cmap.get(clean.slice(i, i + 4).toLowerCase()) ?? '';
  }
  return out;
}

/** Glyphs in the order they are shown (left to right) across Noto appearance Tjs. */
function drawnGlyphs(buffer: Buffer): string {
  const streams = inflatePdfStreams(buffer);
  const cmap = parseToUnicodeMap(streams);
  let drawn = '';
  for (const stream of streams) {
    if (!stream.includes('/NotoSans')) continue;
    const tj = /<([0-9A-Fa-f\s]+)>\s*Tj/g;
    let found: RegExpExecArray | null;
    while ((found = tj.exec(stream))) {
      drawn += decodeTjHex(found[1], cmap);
    }
  }
  return drawn;
}

function firstArabicLetter(text: string): string | undefined {
  for (const char of text) {
    const cp = char.codePointAt(0) ?? 0;
    if (cp >= 0x0600 && cp <= 0x06ff) return char;
    if (cp >= 0xfe70 && cp <= 0xfeff) return char;
  }
  return undefined;
}

describe('PDF appearance drawn glyph order', () => {
  it('paints a pure-Arabic title in visual order (last logical letter first), not reversed twice', async () => {
    const logical = 'استكشاف حالات المادة';
    const template = await makePdfWithFields([{ name: 'Lesson Title' }]);
    const result = await fillGenericPdfTemplate(template, {
      ...sampleLesson,
      title: logical,
      content: { ...sampleLesson.content, title: logical },
    });

    const drawn = drawnGlyphs(result.buffer);
    expect(drawn.length).toBeGreaterThan(0);
    // Stored value stays logical; this test is about paint order, not getText().
    expect((await PDFDocument.load(result.buffer)).getForm().getTextField('Lesson Title').getText()).toBe(
      logical,
    );

    const first = firstArabicLetter(drawn);
    // Visual LTR showing of an RTL phrase starts with the last letter (teh marbuta / ة).
    expect(first).toMatch(/[ة\uFE93]/);
    expect(first).not.toMatch(/[ا\uFE8D]/);
    expect(drawn.includes('استكشاف')).toBe(false);
  });

  it('keeps digits and Latin LTR inside an Arabic appearance line', async () => {
    const logical = 'العام 2026 فيه 45 طالبا (particles)';
    const template = await makePdfWithFields([
      { name: 'Lesson Title', width: 520 },
      { name: 'essentialQuestion', width: 520 },
    ]);
    const result = await fillGenericPdfTemplate(template, {
      ...sampleLesson,
      title: 'العام 2026 فيه 45 طالبا',
      content: {
        ...sampleLesson.content,
        title: 'العام 2026 فيه 45 طالبا',
        essentialQuestion: logical,
      },
    });

    const drawn = drawnGlyphs(result.buffer);
    expect(drawn).toContain('2026');
    expect(drawn).not.toContain('6202');
    expect(drawn).toContain('45');
    expect(drawn).not.toMatch(/(^|[^0-9])54([^0-9]|$)/);
    expect(drawn).toContain('particles');
    expect(drawn).not.toContain('selcitrap');
    // Visual LTR showing of "… 2026 … 45 …" paints 45 left of 2026.
    expect(drawn.indexOf('45')).toBeLessThan(drawn.indexOf('2026'));
  });

  it.each(['- Students will learn', '* Students will learn', '• Students will learn'])(
    'strips a leading list marker from %j before drawing •',
    async (item) => {
      const lesson: LessonPlan = {
        ...sampleLesson,
        content: {
          ...sampleLesson.content,
          objectives: [item],
        },
      };
      const template = await makePdfWithFields([{ name: 'objectives', multiline: true }]);
      const result = await fillGenericPdfTemplate(template, lesson);
      const drawn = drawnGlyphs(result.buffer);

      expect(drawn).toContain('\u2022');
      expect(drawn).toContain('Students will learn');
      expect(drawn).not.toMatch(/\u2022\s*[-*]/);
      expect(drawn).not.toMatch(/[-*]\s*Students/);
    },
  );
});
