import {
  AlignmentType,
  BorderStyle,
  Document,
  LevelFormat,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import type { LessonPlan, LessonSection } from '@/types';
import { formatICanStatements, prepareCellText } from '@/lib/export/lesson-document';

const CONTENT_WIDTH = 9360;
const HEADER_FILL = 'D9D9D9';
const FONT = 'Calibri';
const FONT_SIZE = 20;
const BULLET_REF = 'lesson-plan-bullets';
const CHECKMARK = '\u2713';

const TABLE1_WIDTHS = [1615, 1692, 1131, 1640, 1640, 1642] as const;
const TABLE1_TITLE_SPAN = 2;
const TABLE1_TEACHER_SPAN = 2;
const TABLE2_WIDTHS = [2340, 1755, 1755, 1755, 1755] as const;
const TABLE3_WIDTHS = [2056, 7304] as const;
const TABLE4_WIDTHS = [895, 3278, 1788, 1774, 1625] as const;

const BORDER = { style: BorderStyle.SINGLE, size: 4, color: 'AAAAAA' };
const CELL_BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };
const CELL_MARGINS = { top: 80, bottom: 80, left: 120, right: 120 };
const TABLE4_CELL_MARGINS = { top: 60, bottom: 60, left: 80, right: 80 };

const DOCUMENT_NUMBERING = {
  config: [
    {
      reference: BULLET_REF,
      levels: [
        {
          level: 0,
          format: LevelFormat.BULLET,
          text: '\u2022',
          alignment: AlignmentType.LEFT,
          style: {
            paragraph: {
              indent: { left: 720, hanging: 360 },
            },
          },
        },
      ],
    },
  ],
};

type ParsedActivity = {
  time: string;
  teacher: string;
  learner: string;
  assessment: string;
  resources: string;
};

const DEFAULT_RESOURCES = 'Whiteboard / projector, teacher-created handout';
const MAX_CELL_BULLETS = 4;

function textRun(text: string, bold = false): TextRun {
  return new TextRun({
    text: prepareCellText(text),
    font: FONT,
    size: FONT_SIZE,
    bold,
  });
}

function cellParagraph(text: string, bold = false): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    children: [textRun(text, bold)],
  });
}

function bulletParagraph(text: string): Paragraph {
  return new Paragraph({
    numbering: { reference: BULLET_REF, level: 0 },
    spacing: { after: 60 },
    children: [textRun(text)],
  });
}

function bulletParagraphs(items: string[] | undefined): Paragraph[] {
  if (!items?.length) return [cellParagraph('')];
  return items.map((item) => bulletParagraph(item));
}

function checkboxParagraphs(items: string[], perLine = 2): Paragraph[] {
  if (!items.length) return [cellParagraph('')];

  const paragraphs: Paragraph[] = [];
  for (let i = 0; i < items.length; i += perLine) {
    const line = items
      .slice(i, i + perLine)
      .map((item) => `${CHECKMARK} ${prepareCellText(item)}`)
      .join('   ');
    paragraphs.push(cellParagraph(line));
  }
  return paragraphs;
}

function compactBulletParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 40 },
    indent: { left: 180, hanging: 180 },
    children: [textRun(`• ${text}`)],
  });
}

function compactBulletParagraphs(items: string[], maxBullets = MAX_CELL_BULLETS): Paragraph[] {
  if (!items.length) return [cellParagraph('')];
  return items.slice(0, maxBullets).map((item) => compactBulletParagraph(item));
}

function cellContentParagraphs(text: string, maxBullets = MAX_CELL_BULLETS): Paragraph[] {
  const cleaned = prepareCellText(text);
  if (!cleaned) return [cellParagraph('')];

  let lines = cleaned.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 1) {
    lines = cleaned
      .split(/(?<=[.;!?])\s+/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return compactBulletParagraphs(lines, maxBullets);
}

function textParagraphs(text: string, bold = false): Paragraph[] {
  const lines = prepareCellText(text).split('\n').filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [cellParagraph('', bold)];
  return lines.map((line) => cellParagraph(line, bold));
}

function sumWidths(widths: readonly number[], start: number, count: number): number {
  return widths.slice(start, start + count).reduce((total, width) => total + width, 0);
}

function createFixedTable(options: ConstructorParameters<typeof Table>[0]): Table {
  return new Table({
    ...options,
    layout: TableLayoutType.FIXED,
  });
}

function makeCell(
  content: string | Paragraph[],
  width: number,
  options?: {
    bold?: boolean;
    shading?: boolean;
    columnSpan?: number;
    margins?: typeof CELL_MARGINS;
  },
): TableCell {
  const paragraphs = Array.isArray(content)
    ? content
    : textParagraphs(content, options?.bold);

  return new TableCell({
    borders: CELL_BORDERS,
    margins: options?.margins ?? CELL_MARGINS,
    width: { size: width, type: WidthType.DXA },
    columnSpan: options?.columnSpan,
    shading: options?.shading
      ? { fill: HEADER_FILL, type: ShadingType.CLEAR }
      : undefined,
    children: paragraphs,
  });
}

function makeActivityCell(
  content: string | Paragraph[],
  width: number,
  options?: { header?: boolean; plain?: boolean },
): TableCell {
  let paragraphs: Paragraph[];
  if (Array.isArray(content)) {
    paragraphs = content;
  } else if (options?.header) {
    paragraphs = [cellParagraph(content, true)];
  } else if (options?.plain) {
    paragraphs = [cellParagraph(content)];
  } else {
    paragraphs = cellContentParagraphs(content);
  }

  return new TableCell({
    borders: CELL_BORDERS,
    margins: TABLE4_CELL_MARGINS,
    width: { size: width, type: WidthType.DXA },
    shading: options?.header ? { fill: HEADER_FILL, type: ShadingType.CLEAR } : undefined,
    children: paragraphs,
  });
}

function headerRow(label: string, columnWidths: readonly number[]): TableRow {
  return new TableRow({
    children: [
      makeCell(label, columnWidths.reduce((sum, width) => sum + width, 0), {
        bold: true,
        shading: true,
        columnSpan: columnWidths.length,
      }),
    ],
  });
}

function labelValueRow(
  label: string,
  value: string | Paragraph[],
  columnWidths: readonly [number, number],
): TableRow {
  return new TableRow({
    children: [
      makeCell(label, columnWidths[0], { bold: true }),
      makeCell(value, columnWidths[1]),
    ],
  });
}

function sectionWithBullets(
  title: string,
  items: string[] | undefined,
  fallback: string,
): Paragraph[] {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      spacing: { before: 120, after: 60 },
      children: [textRun(title, true)],
    }),
  ];

  if (items?.length) {
    paragraphs.push(...bulletParagraphs(items));
  } else {
    paragraphs.push(cellParagraph(fallback));
  }

  return paragraphs;
}

function extractField(text: string, labels: string[]): string {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(
      `\\*?${escaped}:\\*?\\s*([\\s\\S]*?)(?=\\*?(?:Time|Teacher Action|Teacher Activity|Student Action|Learner Activity|Learner Activity & Success Criteria|Resources|Checks for Understanding|Formative Assessment|Scaffolding|Method|Evidence|Task|Expected Output|Success Criteria):|$)`,
      'i',
    );
    const match = text.match(regex);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return '';
}

function parseActivityBlock(text: string, fallbackTime = ''): ParsedActivity {
  const clean = prepareCellText(text);
  const timeField = extractField(clean, ['Time']);
  const parenTime = clean.match(/\((\d+\s*(?:min(?:ute)?s?))\)/i);
  const inlineTime = clean.match(/(?:^|\s)(\d+\s*(?:min(?:ute)?s?))/i);
  const time = timeField || parenTime?.[1] || inlineTime?.[1] || fallbackTime;

  const teacher = extractField(clean, ['Teacher Activity', 'Teacher Action']);
  let learner = extractField(clean, [
    'Learner Activity & Success Criteria',
    'Student Action',
    'Learner Activity',
  ]);
  const resources = extractField(clean, ['Resources']);
  const assessment = extractField(clean, [
    'Formative Assessment',
    'Checks for Understanding',
  ]);
  const successCriteria = extractField(clean, ['Success Criteria']);
  const task = extractField(clean, ['Task', 'Expected Output']);

  if (successCriteria && !/\bi can\b/i.test(learner)) {
    learner = learner
      ? `${learner}\n${successCriteria}`
      : successCriteria;
  }

  if (!learner && task) {
    learner = task;
  }

  if (!teacher && !learner) {
    return {
      time,
      teacher: clean,
      learner: '',
      assessment: '',
      resources: '',
    };
  }

  return { time, teacher, learner, assessment, resources };
}

function inferTeachingStrategies(content: LessonSection): string[] {
  const blob = JSON.stringify(content).toLowerCase();
  const candidates: Array<[string, string]> = [
    ['scaffold', 'Scaffolding'],
    ['differentiat', 'Differentiated Learning'],
    ['think/pair/share', 'Think/Pair/Share'],
    ['think pair share', 'Think/Pair/Share'],
    ['group work', 'Group Work'],
    ['group', 'Group Work'],
    ['guided practice', 'Guided Practice (I do / We do / You do)'],
    ['modelling', 'Modelling'],
    ['modeling', 'Modelling'],
    ['active learning', 'Active Learning'],
    ['collaborative', 'Group Work'],
  ];

  const strategies: string[] = [];
  for (const [keyword, label] of candidates) {
    if (blob.includes(keyword) && !strategies.includes(label)) {
      strategies.push(label);
    }
  }

  if (strategies.length === 0) {
    return ['Scaffolding', 'Guided Practice (I do / We do / You do)', 'Active Learning'];
  }
  return strategies;
}

function inferHigherOrderSkills(objectives: string[]): string[] {
  const text = objectives.join(' ').toLowerCase();
  const skills: string[] = [];
  if (/analy/.test(text)) skills.push('Analysis');
  if (/evaluat/.test(text)) skills.push('Evaluation');
  if (/compar|connect/.test(text)) skills.push('Making connections');
  if (/conclud|explain|justif/.test(text)) skills.push('Drawing conclusions', 'Constructing explanation');
  if (/argu|debate|defend/.test(text)) skills.push('Arguing a position');
  if (/creat|design|construct/.test(text)) skills.push('Creating');
  if (skills.length === 0) {
    return ['Analysis', 'Evaluation', 'Making connections'];
  }
  return [...new Set(skills)];
}

function differentiationParagraphs(content: LessonSection): Paragraph[] {
  const { differentiation } = content;

  return [
    ...sectionWithBullets(
      '[1] Working Towards Mastery:',
      differentiation?.support,
      'See differentiated scaffolds during activities.',
    ),
    ...sectionWithBullets(
      '[2] Working at Mastery:',
      content.successCriteria,
      'Students meet lesson success criteria independently.',
    ),
    ...sectionWithBullets(
      '[3] Mastery with Greater Depth:',
      differentiation?.extension,
      'Extension tasks provided for high-attaining learners.',
    ),
    ...sectionWithBullets(
      'SEN:',
      differentiation?.support,
      'Additional scaffolding and check-ins during practice.',
    ),
    ...sectionWithBullets(
      'G&T:',
      differentiation?.extension,
      'Extended analysis and creation tasks.',
    ),
  ];
}

function buildActivityRows(content: LessonSection): TableRow[] {
  const rows: TableRow[] = [
    new TableRow({
      children: TABLE4_WIDTHS.map((width, index) => {
        const labels = [
          'Time',
          'Teacher Activity',
          'Learner Activity & Success Criteria',
          'Formative Assessment',
          'Resources',
        ];
        return makeActivityCell(labels[index], width, { header: true });
      }),
    }),
  ];

  const phases: Array<{ label: string; items: string[]; defaultTime: string }> = [
    { label: 'Hook', items: content.hook ? [content.hook] : [], defaultTime: '5 min' },
    ...content.mainActivities.map((item, index) => ({
      label: `Main Activity ${index + 1}`,
      items: [item],
      defaultTime: '',
    })),
    ...content.guidedPractice.map((item, index) => ({
      label: `Guided Practice ${index + 1}`,
      items: [item],
      defaultTime: '',
    })),
    ...content.independentPractice.map((item, index) => ({
      label: `Independent Practice ${index + 1}`,
      items: [item],
      defaultTime: '',
    })),
    { label: 'Plenary', items: content.plenary ? [content.plenary] : [], defaultTime: '5 min' },
  ];

  const formativePool = content.formativeAssessment ?? [];
  let formativeIndex = 0;

  for (const phase of phases) {
    for (const item of phase.items) {
      const parsed = parseActivityBlock(item, phase.defaultTime);
      const formative =
        parsed.assessment ||
        formativePool[formativeIndex % Math.max(formativePool.length, 1)] ||
        '';
      const learner =
        parsed.learner ||
        formatICanStatements(content.successCriteria) ||
        'See lesson success criteria.';
      const resources = parsed.resources.trim() || DEFAULT_RESOURCES;

      if (!parsed.assessment && formativePool.length > 0) {
        formativeIndex += 1;
      }

      rows.push(
        new TableRow({
          children: [
            makeActivityCell(parsed.time || phase.defaultTime, TABLE4_WIDTHS[0], { plain: true }),
            makeActivityCell(parsed.teacher || phase.label, TABLE4_WIDTHS[1]),
            makeActivityCell(learner, TABLE4_WIDTHS[2]),
            makeActivityCell(formative, TABLE4_WIDTHS[3]),
            makeActivityCell(resources, TABLE4_WIDTHS[4]),
          ],
        }),
      );
    }
  }

  return rows;
}

function buildHeaderInfoTable(lesson: LessonPlan): Table {
  const { content } = lesson;
  const title = content.title || lesson.title;
  const titleWidth = sumWidths(TABLE1_WIDTHS, 0, TABLE1_TITLE_SPAN);
  const teacherWidth = sumWidths(TABLE1_WIDTHS, 4, TABLE1_TEACHER_SPAN);

  return createFixedTable({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [...TABLE1_WIDTHS],
    rows: [
      new TableRow({
        children: [
          makeCell('Lesson Title', titleWidth, { bold: true, shading: true, columnSpan: TABLE1_TITLE_SPAN }),
          makeCell('Date', TABLE1_WIDTHS[2], { bold: true, shading: true }),
          makeCell('Period', TABLE1_WIDTHS[3], { bold: true, shading: true }),
          makeCell('Teacher', teacherWidth, { bold: true, shading: true, columnSpan: TABLE1_TEACHER_SPAN }),
        ],
      }),
      new TableRow({
        children: [
          makeCell(title, titleWidth, { columnSpan: TABLE1_TITLE_SPAN }),
          makeCell('_____________', TABLE1_WIDTHS[2]),
          makeCell('_____________', TABLE1_WIDTHS[3]),
          makeCell('_____________', teacherWidth, { columnSpan: TABLE1_TEACHER_SPAN }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('Grade / Class', TABLE1_WIDTHS[0], { bold: true, shading: true }),
          makeCell(lesson.grade, TABLE1_WIDTHS[1]),
          makeCell('Duration', TABLE1_WIDTHS[2], { bold: true, shading: true }),
          makeCell(`${lesson.duration_minutes} minutes`, TABLE1_WIDTHS[3]),
          makeCell('Stream', TABLE1_WIDTHS[4], { bold: true, shading: true }),
          makeCell('General', TABLE1_WIDTHS[5]),
        ],
      }),
      new TableRow({
        children: [
          makeCell(
            `Subject: ${lesson.subject}${lesson.curriculum ? ` — ${lesson.curriculum}` : ''}`,
            CONTENT_WIDTH,
            { columnSpan: TABLE1_WIDTHS.length },
          ),
        ],
      }),
    ],
  });
}

function buildCurriculumStandardsTable(lesson: LessonPlan): Table {
  return createFixedTable({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [...TABLE2_WIDTHS],
    rows: [
      headerRow('Curriculum Standards / Assessment Information', TABLE2_WIDTHS),
      new TableRow({
        children: [
          makeCell('Current Level (all students)', TABLE2_WIDTHS[0], { bold: true, shading: true }),
          makeCell('Above CS', TABLE2_WIDTHS[1], { bold: true, shading: true }),
          makeCell('In line with CS', TABLE2_WIDTHS[2], { bold: true, shading: true }),
          makeCell('Below CS', TABLE2_WIDTHS[3], { bold: true, shading: true }),
          makeCell('Ability Range', TABLE2_WIDTHS[4], { bold: true, shading: true }),
        ],
      }),
      new TableRow({
        children: [
          makeCell(
            lesson.curriculum
              ? `Aligned to ${lesson.curriculum} expectations`
              : 'Based on last formal assessment results',
            TABLE2_WIDTHS[0],
          ),
          makeCell('______ students', TABLE2_WIDTHS[1]),
          makeCell('______ students', TABLE2_WIDTHS[2]),
          makeCell('______ students', TABLE2_WIDTHS[3]),
          makeCell('Mixed ability', TABLE2_WIDTHS[4]),
        ],
      }),
    ],
  });
}

function buildPlanningTable(content: LessonSection): Table {
  const rows: TableRow[] = [
    headerRow('Planning and Pedagogical Approach', TABLE3_WIDTHS),
    labelValueRow('Learning Objectives', bulletParagraphs(content.objectives), TABLE3_WIDTHS),
    labelValueRow('Essential Question', textOrBlank(content.essentialQuestion), TABLE3_WIDTHS),
    labelValueRow('Prior Knowledge', bulletParagraphs(content.priorKnowledge), TABLE3_WIDTHS),
    labelValueRow(
      'Performance Expectations',
      bulletParagraphs(content.performanceExpectations),
      TABLE3_WIDTHS,
    ),
    labelValueRow('Possible Misconceptions', bulletParagraphs(content.misconceptions), TABLE3_WIDTHS),
    labelValueRow(
      'Science & Engineering Practices',
      bulletParagraphs(content.sciencePractices),
      TABLE3_WIDTHS,
    ),
    labelValueRow('New Vocabulary', bulletParagraphs(content.vocabulary), TABLE3_WIDTHS),
    labelValueRow('Key Concepts', bulletParagraphs(content.keyConcepts), TABLE3_WIDTHS),
    labelValueRow(
      'Teaching Strategies',
      checkboxParagraphs(inferTeachingStrategies(content)),
      TABLE3_WIDTHS,
    ),
    labelValueRow(
      'Formative Assessment Methods',
      checkboxParagraphs(content.formativeAssessment.map(prepareCellText)),
      TABLE3_WIDTHS,
    ),
    labelValueRow('Adaptive Teaching / Differentiation', differentiationParagraphs(content), TABLE3_WIDTHS),
    labelValueRow(
      'Higher Order Thinking Skills',
      checkboxParagraphs(inferHigherOrderSkills(content.objectives)),
      TABLE3_WIDTHS,
    ),
  ];

  return createFixedTable({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [...TABLE3_WIDTHS],
    rows,
  });
}

function buildActivitiesTable(content: LessonSection): Table {
  return createFixedTable({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [...TABLE4_WIDTHS],
    rows: buildActivityRows(content),
  });
}

function tableSpacer(): Paragraph {
  return new Paragraph({ spacing: { after: 120 }, children: [] });
}

function buildSelfReflectionTable(content: LessonSection): Table {
  const nextLessonHint =
    content.formativeAssessment.length > 0
      ? `Formative evidence from this lesson (${content.formativeAssessment
          .slice(0, 2)
          .map(prepareCellText)
          .join('; ')}) will inform grouping and re-teaching in the next lesson.`
      : '_________________________________________________________________________________________';

  const interventionHint =
    content.differentiation.support.length > 0 || content.differentiation.extension.length > 0
      ? `Intervention: ${content.differentiation.support.map(prepareCellText).join(' ') || 'Targeted re-teaching as needed.'}\nAcceleration: ${content.differentiation.extension.map(prepareCellText).join(' ') || 'Extension tasks for high-attaining learners.'}`
      : '_________________________________________________________________________________________';

  const reflectionContent: Paragraph[] = [
    cellParagraph('How has formative data from previous lesson(s) informed this lesson?', true),
    cellParagraph('_________________________________________________________________________________________'),
    cellParagraph(
      'How will formative data from this lesson guide and inform planning for the next lesson(s)?',
      true,
    ),
    ...textParagraphs(nextLessonHint),
    cellParagraph('What intervention / acceleration is required based on this formative data?', true),
    ...textParagraphs(interventionHint),
  ];

  return createFixedTable({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [CONTENT_WIDTH],
    rows: [
      headerRow('Self-Reflection: Data-Informed Future Planning', [CONTENT_WIDTH]),
      new TableRow({
        children: [makeCell(reflectionContent, CONTENT_WIDTH)],
      }),
    ],
  });
}

function textOrBlank(value: string | undefined): string {
  return value?.trim() ? prepareCellText(value) : '';
}

export async function generateDocx(lesson: LessonPlan): Promise<Buffer> {
  const { content } = lesson;

  const doc = new Document({
    numbering: DOCUMENT_NUMBERING,
    styles: {
      default: {
        document: {
          run: { font: FONT, size: FONT_SIZE },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: [
          buildHeaderInfoTable(lesson),
          tableSpacer(),
          buildCurriculumStandardsTable(lesson),
          tableSpacer(),
          buildPlanningTable(content),
          tableSpacer(),
          buildActivitiesTable(content),
          tableSpacer(),
          buildSelfReflectionTable(content),
        ],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

/** Formats checkmark lines for tests and previews (matches DOCX output). */
export function formatCheckboxItems(items: string[], perLine = 2): string {
  if (!items.length) return '';
  const lines: string[] = [];
  for (let i = 0; i < items.length; i += perLine) {
    lines.push(
      items
        .slice(i, i + perLine)
        .map((item) => `${CHECKMARK} ${prepareCellText(item)}`)
        .join('   '),
    );
  }
  return lines.join('\n');
}

export {
  parseActivityBlock,
  checkboxParagraphs,
  inferTeachingStrategies,
  inferHigherOrderSkills,
  bulletParagraphs,
  CHECKMARK,
};
