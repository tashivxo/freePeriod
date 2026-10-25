const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  Header,
  Footer,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  WidthType,
  ShadingType,
  PageNumber,
  LevelFormat,
} = require('docx');
const fs = require('fs');
const path = require('path');

const thin = { style: BorderStyle.SINGLE, size: 8, color: 'CCCCCC' };
const borders = { top: thin, bottom: thin, left: thin, right: thin };

const PAGE_W = 11906; // A4
const MARGIN = 1008; // 0.7"
const CONTENT_W = PAGE_W - MARGIN * 2; // 9890

function p(text, opts = {}) {
  const { bold, italics, size = 22, color, after = 120, before = 0 } = opts;
  return new Paragraph({
    spacing: { after, before, line: 276 },
    children: [new TextRun({ text, bold, italics, size, font: 'Arial', color })],
  });
}

function answerBox(lines = 3) {
  const rows = [];
  for (let i = 0; i < lines; i++) {
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            borders,
            width: { size: CONTENT_W, type: WidthType.DXA },
            shading: { fill: 'FAFAFA', type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [
              new Paragraph({
                spacing: { after: 0 },
                children: [
                  new TextRun({
                    text: i === 0 ? 'Your answer:' : ' ',
                    size: 20,
                    font: 'Arial',
                    color: '888888',
                    italics: true,
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );
  }
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    rows,
  });
}

function choice(label) {
  return new Paragraph({
    spacing: { after: 80, line: 276 },
    indent: { left: 180 },
    children: [
      new TextRun({ text: '☐  ', size: 22, font: 'Arial' }),
      new TextRun({ text: label, size: 22, font: 'Arial' }),
    ],
  });
}

function bullet(text, ref) {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 80, line: 276 },
    children: [new TextRun({ text, size: 22, font: 'Arial' })],
  });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      {
        id: 'Heading1',
        name: 'Heading 1',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 32, bold: true, font: 'Arial', color: '1A1A1A' },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 26, bold: true, font: 'Arial', color: '1A1A1A' },
        paragraph: { spacing: { before: 260, after: 120 }, outlineLevel: 1 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: 'findings',
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: '•',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
      {
        reference: 'impact',
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: '•',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
      {
        reference: 'how',
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: '%1.',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: PAGE_W, height: 16838 },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              spacing: { after: 0 },
              children: [
                new TextRun({
                  text: 'FreePeriod  ·  Owner decision brief',
                  size: 18,
                  font: 'Arial',
                  color: '666666',
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'Confidential — for product owner decisions  ·  Page ',
                  size: 16,
                  font: 'Arial',
                  color: '888888',
                }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  size: 16,
                  font: 'Arial',
                  color: '888888',
                }),
              ],
            }),
          ],
        }),
      },
      children: [
        p('CURRICULUM ALIGNMENT', { bold: true, size: 18, color: '5B6B7C', after: 60 }),
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: 'Owner Decision Brief',
              bold: true,
              size: 44,
              font: 'Arial',
              color: '111111',
            }),
          ],
        }),
        p(
          'Please tick options, fill in the answer boxes, and return this file. Your answers decide what we build next.',
          { italics: true, color: '555555', after: 200 }
        ),

        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [2472, 7418],
          rows: [
            ['Prepared for', 'App owner / product lead'],
            ['Prepared by', 'Development'],
            ['Date', '8 August 2026'],
            ['Related feedback', 'Ms Amani (CDI) — UAE MOE curriculum alignment'],
            ['Return by', '________________________'],
          ].map(
            ([label, value]) =>
              new TableRow({
                children: [
                  new TableCell({
                    borders,
                    width: { size: 2472, type: WidthType.DXA },
                    shading: { fill: 'F0F2F5', type: ShadingType.CLEAR },
                    margins: { top: 60, bottom: 60, left: 100, right: 100 },
                    children: [p(label, { bold: true, size: 18, after: 0 })],
                  }),
                  new TableCell({
                    borders,
                    width: { size: 7418, type: WidthType.DXA },
                    margins: { top: 60, bottom: 60, left: 100, right: 100 },
                    children: [p(value, { size: 18, after: 0 })],
                  }),
                ],
              })
          ),
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 280, after: 160 },
          children: [
            new TextRun({
              text: '1. Why we need your decisions',
              bold: true,
              size: 32,
              font: 'Arial',
              color: '1A1A1A',
            }),
          ],
        }),
        p(
          'A teacher who uses FreePeriod reported that selecting “UAE MOE” still produces American science standards codes (NGSS, e.g. PS1 / ESS1). That is not UAE Ministry of Education curriculum.'
        ),
        p('We reviewed the app and confirmed the feedback is accurate:'),
        bullet(
          'Curriculum is currently a label in a dropdown (IB, CAPS, UAE MOE, etc.).',
          'findings'
        ),
        bullet(
          'Generation only tells the AI the curriculum name — it does not look up official standards.',
          'findings'
        ),
        bullet(
          'The lesson template itself is biased toward US NGSS examples, which pushes wrong codes.',
          'findings'
        ),
        bullet(
          'Teachers can optionally upload a curriculum PDF; that is the only way real standards text enters the prompt today.',
          'findings'
        ),
        p(
          'Wrong standards codes are a serious trust risk for teachers during observations and curriculum audits. This is the main product decision we need from you before we invest engineering time.'
        ),

        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 280, after: 160 },
          children: [
            new TextRun({
              text: '2. What we recommend (for context)',
              bold: true,
              size: 32,
              font: 'Arial',
              color: '1A1A1A',
            }),
          ],
        }),
        p('Engineering recommendation — you can override any of this:'),
        bullet(
          'Short term: stop inventing fake standards codes, remove NGSS bias from the template, and show a clear “verify against official curriculum” warning on generated lessons.',
          'impact'
        ),
        bullet(
          'Next: build real curriculum “packs” (curated guidelines / verified outcomes) for one priority curriculum at a time — not scrape every official PDF for all curricula at once.',
          'impact'
        ),
        bullet(
          'Full “search the internet / RAG over all official PDFs” for every curriculum is slower, costlier, and has licensing issues (especially IB). Better as a later phase for select curricula.',
          'impact'
        ),

        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 280, after: 160 },
          children: [
            new TextRun({
              text: '3. Decisions we need from you',
              bold: true,
              size: 32,
              font: 'Arial',
              color: '1A1A1A',
            }),
          ],
        }),
        p(
          'Tick one option per question (or write your own). Fill every answer box — even a short “not sure” helps.'
        ),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 260, after: 120 },
          children: [
            new TextRun({
              text: 'Q1 — Which curriculum should we prioritize first for real alignment?',
              bold: true,
              size: 26,
              font: 'Arial',
              color: '1A1A1A',
            }),
          ],
        }),
        p(
          'This is the first curriculum we would build a verified pack for (research + inject real guidelines into generation).',
          { italics: true, color: '555555' }
        ),
        choice(
          'UAE MOE first — directly addresses Ms Amani’s feedback (harder: official docs are often Arabic; needs educator review)'
        ),
        choice(
          'Whichever curriculum our users select most often (we can pull usage data if useful)'
        ),
        choice(
          'An easier “proof of pipeline” curriculum first (e.g. Common Core or GCSE board specs — public English docs)'
        ),
        choice('Other (specify below)'),
        new Paragraph({ spacing: { after: 80 }, children: [] }),
        answerBox(2),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 260, after: 120 },
          children: [
            new TextRun({
              text: 'Q2 — How deep should the first release go?',
              bold: true,
              size: 26,
              font: 'Arial',
              color: '1A1A1A',
            }),
          ],
        }),
        choice(
          'Trust fixes only (remove NGSS bias, ban invented codes, in-app disclaimer, stronger use of uploaded docs) — fastest'
        ),
        choice(
          'Trust fixes + one curated curriculum pack for the priority curriculum in Q1'
        ),
        choice(
          'Larger vision now: research/index official docs across multiple curricula (longer, licensing-heavy)'
        ),
        choice('Other (specify below)'),
        new Paragraph({ spacing: { after: 80 }, children: [] }),
        answerBox(2),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 260, after: 120 },
          children: [
            new TextRun({
              text: 'Q3 — Can we get a subject-matter reviewer for the priority curriculum?',
              bold: true,
              size: 26,
              font: 'Arial',
              color: '1A1A1A',
            }),
          ],
        }),
        p(
          'Especially important for UAE MOE. Without educator review, we should not claim “verified” alignment.',
          { italics: true, color: '555555' }
        ),
        choice(
          'Yes — we have (or will hire/contract) a teacher/curriculum specialist who can check codes and wording'
        ),
        choice(
          'Not yet — ship trust fixes and guideline-level packs only; no “verified standards” claims'
        ),
        choice(
          'I will review myself / another named person: ________________________'
        ),
        choice('Other (specify below)'),
        new Paragraph({ spacing: { after: 80 }, children: [] }),
        answerBox(2),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 260, after: 120 },
          children: [
            new TextRun({
              text: 'Q4 — UAE: should we split MOE and ADEC (Abu Dhabi) now?',
              bold: true,
              size: 26,
              font: 'Arial',
              color: '1A1A1A',
            }),
          ],
        }),
        p(
          'Ms Amani noted UAE MOE covers Dubai & Northern Emirates; Abu Dhabi schools often use ADEC/ADEK. Wrong dropdown choice is another trust issue.',
          { italics: true, color: '555555' }
        ),
        choice(
          'Yes — add ADEC/ADEK as a separate curriculum option in the first UAE pass'
        ),
        choice(
          'Not yet — keep one UAE option, clarify the label/help text, split later if usage justifies it'
        ),
        choice('Unsure — decide after we see how many UAE users we have'),
        choice('Other (specify below)'),
        new Paragraph({ spacing: { after: 80 }, children: [] }),
        answerBox(2),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 260, after: 120 },
          children: [
            new TextRun({
              text: 'Q5 — What is our liability / messaging posture?',
              bold: true,
              size: 26,
              font: 'Arial',
              color: '1A1A1A',
            }),
          ],
        }),
        choice(
          'Prominent in-app disclaimer is enough for now (“AI-suggested — verify before observation/submission”)'
        ),
        choice(
          'Disclaimer alone is not enough — we should not market curriculum-specific alignment until packs exist'
        ),
        choice(
          'We want to claim verified alignment for specific curricula once packs + human review are in place'
        ),
        choice('Other (specify below)'),
        new Paragraph({ spacing: { after: 80 }, children: [] }),
        answerBox(2),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 260, after: 120 },
          children: [
            new TextRun({
              text: 'Q6 — Budget for non-engineering work',
              bold: true,
              size: 26,
              font: 'Arial',
              color: '1A1A1A',
            }),
          ],
        }),
        p(
          'Curating trustworthy packs (especially Arabic MOE docs, or careful IB guidance that does not redistribute copyrighted guides) needs human time, not only code.',
          { italics: true, color: '555555' }
        ),
        choice(
          'Yes — approve a small budget / contractor hours for curriculum curation & review'
        ),
        choice(
          'No paid curation yet — engineer with public English sources + trust fixes only'
        ),
        choice(
          'Owner will supply official documents / excerpts we are allowed to use'
        ),
        choice('Other (specify below)'),
        new Paragraph({ spacing: { after: 80 }, children: [] }),
        answerBox(2),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 260, after: 120 },
          children: [
            new TextRun({
              text: 'Q7 — Who owns keeping curriculum packs up to date?',
              bold: true,
              size: 26,
              font: 'Arial',
              color: '1A1A1A',
            }),
          ],
        }),
        p(
          'Exam boards and ministries revise documents. Stale “verified” codes can be worse than no codes.',
          { italics: true, color: '555555' }
        ),
        choice(
          'Owner / product will own a periodic review cadence (e.g. each term or annually)'
        ),
        choice(
          'Development will track revision dates and flag stale packs in the UI'
        ),
        choice(
          'Defer — no ongoing ownership commitment until after the first pack ships'
        ),
        choice('Other (specify below)'),
        new Paragraph({ spacing: { after: 80 }, children: [] }),
        answerBox(2),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 260, after: 120 },
          children: [
            new TextRun({
              text: 'Q8 — Any curricula we should explicitly deprioritize or remove from the dropdown?',
              bold: true,
              size: 26,
              font: 'Arial',
              color: '1A1A1A',
            }),
          ],
        }),
        p(
          'Listing a curriculum implies parity. Options with no pack could show as “unverified” later. Tell us if any should be removed or renamed now.',
          { italics: true, color: '555555' }
        ),
        new Paragraph({ spacing: { after: 80 }, children: [] }),
        answerBox(3),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 260, after: 120 },
          children: [
            new TextRun({
              text: 'Q9 — Anything else we should know?',
              bold: true,
              size: 26,
              font: 'Arial',
              color: '1A1A1A',
            }),
          ],
        }),
        p(
          'Market focus, partner schools, upcoming demos, legal constraints, or teacher segments that matter most.',
          { italics: true, color: '555555' }
        ),
        new Paragraph({ spacing: { after: 80 }, children: [] }),
        answerBox(4),

        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 280, after: 160 },
          children: [
            new TextRun({
              text: '4. How we will use your answers',
              bold: true,
              size: 32,
              font: 'Arial',
              color: '1A1A1A',
            }),
          ],
        }),
        bullet(
          'Development will turn your choices into a concrete build plan (what ships first, what waits).',
          'how'
        ),
        bullet(
          'We will not start multi-curriculum research/RAG work until Q1–Q2 are decided.',
          'how'
        ),
        bullet(
          'Return this completed file to development; we will confirm the plan before coding.',
          'how'
        ),

        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 280, after: 160 },
          children: [
            new TextRun({
              text: '5. Sign-off',
              bold: true,
              size: 32,
              font: 'Arial',
              color: '1A1A1A',
            }),
          ],
        }),
        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [4945, 4945],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders,
                  width: { size: 4945, type: WidthType.DXA },
                  margins: { top: 100, bottom: 100, left: 120, right: 120 },
                  children: [
                    p('Owner name', { bold: true, size: 18, after: 60 }),
                    p('______________________________', { size: 20, after: 160 }),
                    p('Date', { bold: true, size: 18, after: 60 }),
                    p('______________________________', { size: 20, after: 0 }),
                  ],
                }),
                new TableCell({
                  borders,
                  width: { size: 4945, type: WidthType.DXA },
                  margins: { top: 100, bottom: 100, left: 120, right: 120 },
                  children: [
                    p('Signature / approval', { bold: true, size: 18, after: 60 }),
                    p('______________________________', { size: 20, after: 160 }),
                    p('Preferred contact for follow-ups', {
                      bold: true,
                      size: 18,
                      after: 60,
                    }),
                    p('______________________________', { size: 20, after: 0 }),
                  ],
                }),
              ],
            }),
          ],
        }),

        new Paragraph({ spacing: { before: 280 }, children: [] }),
        p(
          'Thank you — once this returns, we can proceed with a clear, scoped plan.',
          { italics: true, color: '555555', after: 0 }
        ),
      ],
    },
  ],
});

async function main() {
  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(
    __dirname,
    '..',
    'docs',
    'curriculum-alignment-owner-decision-brief.docx'
  );
  const downloadPath = path.join(
    process.env.USERPROFILE || '',
    'Downloads',
    'FreePeriod-Curriculum-Alignment-Owner-Decision-Brief.docx'
  );

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buffer);
  fs.writeFileSync(downloadPath, buffer);
  console.log('Wrote', outPath);
  console.log('Wrote', downloadPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
