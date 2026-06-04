import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableCell,
  TableRow,
  WidthType,
} from 'docx';
import type { LessonPlan } from '@/types';

const CORAL_HEX = 'FF8BB0';
const TEXT_HEX = '1A1A2E';

function strip(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

function asList(value: string[] | undefined): string[] {
  return Array.isArray(value) ? value : [];
}

function textOrEmpty(value: string | undefined): string {
  return value ?? '';
}

function metadataCell(label: string, value: string): TableCell {
  return new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: `${label}: `, bold: true, font: 'Calibri', size: 20, color: TEXT_HEX }),
          new TextRun({ text: value, font: 'Calibri', size: 20, color: TEXT_HEX }),
        ],
      }),
    ],
  });
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
  const children: (Paragraph | Table)[] = [];

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
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: 'Formal Lesson Plan',
          font: 'Calibri',
          size: 22,
          color: '6B7280',
          italics: true,
        }),
      ],
    }),
  );
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            metadataCell('Subject', lesson.subject),
            metadataCell('Grade / Class', lesson.grade),
          ],
        }),
        new TableRow({
          children: [
            metadataCell('Duration', `${lesson.duration_minutes} minutes`),
            metadataCell('Curriculum', lesson.curriculum ?? 'Not specified'),
          ],
        }),
      ],
    }),
  );
  children.push(
    new Paragraph({
      spacing: { after: 200 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
      },
    }),
  );

  // Essential Question
  if (content.essentialQuestion) {
    children.push(heading2('Essential Question'));
    children.push(bodyParagraph(content.essentialQuestion));
  }

  // Objectives
  children.push(heading2('Learning Objectives'));
  asList(content.objectives).forEach((o) => children.push(bulletItem(o)));

  // Success Criteria
  children.push(heading2('Success Criteria'));
  asList(content.successCriteria).forEach((s) => children.push(bulletItem(s)));

  // Key Concepts
  children.push(heading2('Key Concepts'));
  asList(content.keyConcepts).forEach((k) => children.push(bulletItem(k)));

  // Vocabulary
  if (content.vocabulary?.length) {
    children.push(heading2('New Vocabulary'));
    asList(content.vocabulary).forEach((v) => children.push(bulletItem(v)));
  }

  // Hook
  children.push(heading2('Hook Activity'));
  children.push(bodyParagraph(textOrEmpty(content.hook)));

  // Main Activities
  children.push(heading2('Main Activities'));
  asList(content.mainActivities).forEach((a) => children.push(bulletItem(a)));

  // Guided Practice
  children.push(heading2('Guided Practice'));
  asList(content.guidedPractice).forEach((g) => children.push(bulletItem(g)));

  // Independent Practice
  children.push(heading2('Independent Practice'));
  asList(content.independentPractice).forEach((p) => children.push(bulletItem(p)));

  // Formative Assessment
  children.push(heading2('Formative Assessment'));
  asList(content.formativeAssessment).forEach((f) => children.push(bulletItem(f)));

  // Differentiation
  children.push(heading2('Differentiation'));
  children.push(subHeading('Support'));
  asList(content.differentiation?.support).forEach((s) => children.push(bulletItem(s)));
  children.push(subHeading('Extension'));
  asList(content.differentiation?.extension).forEach((e) => children.push(bulletItem(e)));

  // Real-World Connections
  children.push(heading2('Real-World Connections'));
  asList(content.realWorldConnections).forEach((r) => children.push(bulletItem(r)));

  // Plenary
  children.push(heading2('Plenary'));
  children.push(bodyParagraph(textOrEmpty(content.plenary)));

  const doc = new Document({
    sections: [{ children }],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
