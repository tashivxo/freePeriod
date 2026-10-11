/**
 * Reproduces tests/fixtures/synthetic-daily-english-lesson-plan.docx
 *
 * Synthetic stand-in for a school Daily English lesson-plan form.
 * Generic placeholder text only. Recreates the OOXML structures that
 * affect generic DOCX fill:
 *   - Resources column vertically merged (vMerge restart + continue)
 *     across four phase rows
 *   - In-cell guidance sub-labels (Student Participation, Formal
 *     Introduction, [1]/[2]/[3] bands, Formative Data, Plenary,
 *     Homework Differentiation)
 *   - Adaptive Teaching headings including Working At Mastery,
 *     Other adaptive teaching strategies, and SEN/LS/G&T
 *   - Numbered (numPr) Adaptive headings plus an Independent Practice
 *     value cell, so filled items inherit list numbering
 *   - A Practice time cell that already prints "25 min"
 *
 * Run from the repo root:
 *   node tests/fixtures/generate-synthetic-daily-english-lesson-plan.mjs
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AlignmentType,
  Document,
  LevelFormat,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalMergeType,
  WidthType,
} from 'docx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'synthetic-daily-english-lesson-plan.docx');

const TIME_W = 919;
const TEACHER_W = 2337;
const LEARNER_W = 4659;
const ASSESS_W = 3240;
const RESOURCE_W = 3960;
const LABEL_W = 3256;
const VALUE_W = 11859;
const ADAPTIVE_LIST = 'adaptive-list';

function para(text = '', numbered = false) {
  return new Paragraph({
    numbering: numbered ? { reference: ADAPTIVE_LIST, level: 0 } : undefined,
    children: [new TextRun({ text })],
  });
}

function cell(lines, width, extra = {}, numbered = false) {
  const children = (lines.length > 0 ? lines : ['']).map((text) => para(text, numbered));
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    ...extra,
    children,
  });
}

function labelValueRow(labelLines, valueLines, numberedValue = false) {
  return new TableRow({
    children: [cell(labelLines, LABEL_W), cell(valueLines, VALUE_W, {}, numberedValue)],
  });
}

function activityRow(timeLines, teacherLines, learnerLines, assessLines, resourceMerge) {
  return new TableRow({
    children: [
      cell(timeLines, TIME_W),
      cell(teacherLines, TEACHER_W),
      cell(learnerLines, LEARNER_W),
      cell(assessLines, ASSESS_W),
      cell([''], RESOURCE_W, { verticalMerge: resourceMerge }),
    ],
  });
}

const doc = new Document({
  creator: 'Free Period test fixture generator',
  title: 'synthetic-daily-english-lesson-plan',
  description: 'Synthetic Daily English lesson plan structures for fill tests',
  numbering: {
    config: [
      {
        reference: ADAPTIVE_LIST,
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: '\u2022',
            alignment: AlignmentType.LEFT,
          },
        ],
      },
    ],
  },
  sections: [
    {
      children: [
        new Table({
          width: { size: LABEL_W + VALUE_W, type: WidthType.DXA },
          columnWidths: [LABEL_W, VALUE_W],
          rows: [
            labelValueRow(['Lesson Title'], ['Sample lesson title placeholder']),
            labelValueRow(['Duration'], ['']),
            labelValueRow(['Grade/Class'], ['']),
            labelValueRow(['Possible Misconceptions'], ['']),
            labelValueRow(
              ['Adaptive Teaching / Differentiation'],
              [
                'Prior knowledge:',
                'Working Towards Mastery (all):',
                'Working At Mastery (most):',
                'Mastery with Greater Depth (some):',
                'Other adaptive teaching strategies:',
                'Special Educational Needs (SEN registered), Learning Support (LS), Gifted & Talented (G&T):',
              ],
              true,
            ),
            labelValueRow(['Independent Practice'], [''], true),
          ],
        }),
        new Table({
          width: {
            size: TIME_W + TEACHER_W + LEARNER_W + ASSESS_W + RESOURCE_W,
            type: WidthType.DXA,
          },
          columnWidths: [TIME_W, TEACHER_W, LEARNER_W, ASSESS_W, RESOURCE_W],
          rows: [
            new TableRow({
              children: [
                cell(['Time'], TIME_W),
                cell(['Teacher activity'], TEACHER_W),
                cell(['Learner activity & Success Criteria'], LEARNER_W),
                cell(['Formative assessment'], ASSESS_W),
                cell(['Learning materials /resources'], RESOURCE_W),
              ],
            }),
            new TableRow({
              children: [
                cell([''], TIME_W),
                cell(['How are you unpacking, modelling, explaining?'], TEACHER_W),
                cell(['What are the learners doing to master the content?'], LEARNER_W),
                cell(['How are you assessing learning as it is happening?'], ASSESS_W),
                cell(['Manipulatives, resources, digital or physical materials.'], RESOURCE_W),
              ],
            }),
            activityRow(
              [''],
              ['Do Now (Starter Activity)'],
              [''],
              [''],
              VerticalMergeType.RESTART,
            ),
            activityRow(
              [''],
              ['Activation (Introducing New Content)'],
              ['Student Participation:', 'Differentiation:'],
              ['Formal Introduction:'],
              VerticalMergeType.CONTINUE,
            ),
            activityRow(
              ['25 min', 'Check progress every few minutes'],
              [
                'Demonstration of Learning (Practice - 25 minutes)',
                'Differentiated Activities/ Worksheets:',
                '[1] Working Towards Mastery:',
                '[2] Working at Mastery:',
                '[3] Mastery with Greater Depth:',
              ],
              [
                'Student-Centered Approach:',
                'Differentiated success criteria:',
                '[1] Working Towards Mastery:',
                '[2] Working at Mastery:',
                '[3] Mastery with Greater Depth:',
              ],
              ['Formative Data:'],
              VerticalMergeType.CONTINUE,
            ),
            activityRow(
              [''],
              ['Consolidation / Review', 'Class Discussion:'],
              [
                'Plenary: Review questions and Exit Ticket',
                'Homework Differentiation',
                '(Based on Exit Ticket Responses)',
                'Working Towards Mastery:',
                'Working At Mastery:',
                'Mastery with Greater Depth:',
                'Extension:',
              ],
              [
                'Formative Data:',
                'Identify students who need a follow-up review.',
                'Use the exit ticket to plan the next lesson.',
              ],
              VerticalMergeType.CONTINUE,
            ),
          ],
        }),
      ],
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync(OUT, buffer);
console.log(`Wrote ${OUT} (${buffer.length} bytes)`);
