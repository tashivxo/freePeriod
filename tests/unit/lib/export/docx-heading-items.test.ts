import { TextEncoder, TextDecoder } from 'util';
import JSZip from 'jszip';
import { Document, LevelFormat, Packer } from 'docx';
import { bulletParagraphs } from '@/lib/export/docx';

Object.assign(globalThis, { TextEncoder, TextDecoder });

async function documentXml(items: string[]): Promise<string> {
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'lesson-plan-bullets',
          levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022' }],
        },
      ],
    },
    sections: [{ children: bulletParagraphs(items) }],
  });
  const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
  return zip.file('word/document.xml')!.async('string');
}

function paragraphs(xml: string): string[] {
  return xml.match(/<w:p>[\s\S]*?<\/w:p>|<w:p [\s\S]*?<\/w:p>/g) ?? [];
}

describe('built-in DOCX bold label items', () => {
  it('writes a bold label item as a plain bold paragraph and keeps points bulleted', async () => {
    const paras = paragraphs(
      await documentXml(['- **Working Towards Mastery (all):**', 'Provide a glossary', 'Offer sentence frames']),
    );
    expect(paras).toHaveLength(3);
    expect(paras[0]).not.toContain('<w:numPr>');
    expect(paras[0]).toContain('<w:b/>');
    expect(paras[0]).toContain('Working Towards Mastery (all):');
    expect(paras[0]).not.toContain('*');
    expect(paras[1]).toContain('<w:numPr>');
    expect(paras[2]).toContain('<w:numPr>');
  });

  it('splits a label with inline text into a heading and a separate bullet', async () => {
    const paras = paragraphs(await documentXml(['**Extension:** Build a model']));
    expect(paras).toHaveLength(2);
    expect(paras[0]).not.toContain('<w:numPr>');
    expect(paras[0]).toContain('Extension:');
    expect(paras[0]).not.toContain('Build a model');
    expect(paras[1]).toContain('<w:numPr>');
    expect(paras[1]).toContain('Build a model');
  });

  it('keeps ordinary bullets bulleted', async () => {
    const paras = paragraphs(await documentXml(['one', 'two']));
    expect(paras.every((p) => p.includes('<w:numPr>'))).toBe(true);
  });
});
