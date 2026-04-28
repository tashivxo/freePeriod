import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from 'docx';
import type { LessonPlan } from '@/types/database';

const CORAL_HEX = 'FF8BB0';
const TEXT_HEX = '1A1A2E';

function strip(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

function heading2(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 120 },
    children: [
      new TextRun({
        text,
        bold: true,
        color: CORAL_HEX,
        font: 'Calibri',
        size: 28,
      }),
    ],
  });
}

function bulletItem(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [
      new TextRun({ text: strip(text), font: 'Calibri', size: 22, color: TEXT_HEX }),
    ],
  });
}

function bodyParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({ text: strip(text), font: 'Calibri', size: 22, color: TEXT_HEX }),
    ],
  });
}

function subHeading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({
        text,
        bold: true,
        font: 'Calibri',
        size: 24,
        color: TEXT_HEX,
      }),
    ],
  });
}

export async function generateDocx(lesson: LessonPlan): Promise<Buffer> {
  const { content } = lesson;
  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: content.title || lesson.title,
          bold: true,
          font: 'Calibri',
          size: 36,
          color: CORAL_HEX,
        }),
      ],
    }),
  );

  // Metadata line
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
      },
      children: [
        new TextRun({
          text: `${lesson.subject} · ${lesson.grade} · ${lesson.duration_minutes} minutes`,
          font: 'Calibri',
          size: 20,
          color: '6B7280',
          italics: true,
        }),
      ],
    }),
  );

  // Objectives
  children.push(heading2('Learning Objectives'));
  content.objectives.forEach((o) => children.push(bulletItem(o)));

  // Success Criteria
  children.push(heading2('Success Criteria'));
  content.successCriteria.forEach((s) => children.push(bulletItem(s)));

  // Key Concepts
  children.push(heading2('Key Concepts'));
  content.keyConcepts.forEach((k) => children.push(bulletItem(k)));

  // Hook
  children.push(heading2('Hook Activity'));
  children.push(bodyParagraph(content.hook));

  // Main Activities
  children.push(heading2('Main Activities'));
  content.mainActivities.forEach((a) => children.push(bulletItem(a)));

  // Guided Practice
  children.push(heading2('Guided Practice'));
  content.guidedPractice.forEach((g) => children.push(bulletItem(g)));

  // Independent Practice
  children.push(heading2('Independent Practice'));
  content.independentPractice.forEach((p) => children.push(bulletItem(p)));

  // Formative Assessment
  children.push(heading2('Formative Assessment'));
  content.formativeAssessment.forEach((f) => children.push(bulletItem(f)));

  // Differentiation
  children.push(heading2('Differentiation'));
  children.push(subHeading('Support'));
  content.differentiation.support.forEach((s) => children.push(bulletItem(s)));
  children.push(subHeading('Extension'));
  content.differentiation.extension.forEach((e) => children.push(bulletItem(e)));

  // Real-World Connections
  children.push(heading2('Real-World Connections'));
  content.realWorldConnections.forEach((r) => children.push(bulletItem(r)));

  // Plenary
  children.push(heading2('Plenary'));
  children.push(bodyParagraph(content.plenary));

  const doc = new Document({
    sections: [{ children }],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
