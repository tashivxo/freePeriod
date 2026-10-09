/**
 * Reproduces tests/fixtures/static-formal-lesson-plan.pdf
 *
 * Synthetic stand-in for a Pages-exported Formal Lesson Plan Template:
 * 10 landscape US-Letter pages (792x612), no AcroForm fields, no widgets.
 * Empty squares are vector ☐ stand-ins (Helvetica cannot encode U+2610).
 *
 * Run from the repo root:
 *   node tests/fixtures/generate-static-formal-lesson-plan-pdf.mjs
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'static-formal-lesson-plan.pdf');
const PAGE_SIZE = [792, 612];
const MARGIN = 36;
const FIXED_DATE = new Date('2026-10-08T17:03:06.000Z');
const BLACK = rgb(0, 0, 0);

const SKILL_CHECKS = [
  'Responsibility for their own learning',
  'Interactions, collaboration and communication skills',
  'Application of learning to the world',
  'Making connections between areas of learning',
  'Goal setting and self-monitoring',
  'Enquiry/Research',
  'Critical Thinking',
  'Problem Solving',
  'Use of learning technologies',
  'Metacognition',
];

const STRATEGY_CHECKS = [
  'Scaffolding',
  'Differentiated Learning',
  'Group Work (Brainstorming, Turn-taking, Roleplaying etc)',
  'Think/Pair/Share',
  'Active Learning (reciprocal questioning, pause procedure etc)',
  'Peer Teaching',
  'Socratic Questioning',
  'Experiential Learning',
  'Game-based Learning',
  'Flexible Seating',
  'Student Presentation',
  'Guided Practice (I do/we do/you do method)',
  'Discovery Learning',
  'Inquiry-based instruction',
  'Modelling',
  'Student-led Teaching',
];

const ASSESSMENT_CHECKS = [
  'Think/Pair/Share',
  'Student Self-evaluation',
  'Peer-assessment',
  'Verbal Feedback',
  'Written Feedback',
  'Quiz',
  'Learning Journals',
  'Reflection Logs',
  'Exit Tickets',
  'Traffic Light Cards',
  'Observations',
  'Other',
];

const INNOVATION_CHECKS = [
  'Creativity and innovation',
  'Use of learning technologies',
  'Global competencies',
  'UAE Cultural identity',
  'Islamic values',
  'Civic responsibility',
  'Media and information literacy',
  'Adaptability and flexibility',
  'Initiative and self-direction',
  'Ethical use of digital tools',
  'Digital collaboration',
  'Resilience and emotional regulation',
  'AI',
  'Other',
];

const SEATING_CHECKS = [
  'Individual',
  'Pairs',
  'Groups (same level)',
  'Groups (mixed levels)',
  'Workstations (rotations)',
  'Flexible',
  'U-shape',
  'Other',
];

/** @param {import('pdf-lib').PDFPage} page */
function drawCheckbox(page, x, y) {
  page.drawRectangle({
    x,
    y: y - 1.5,
    width: 8,
    height: 8,
    borderWidth: 0.8,
    borderColor: BLACK,
    color: rgb(1, 1, 1),
  });
}

async function main() {
  const pdf = await PDFDocument.create();
  pdf.setTitle('static-formal-lesson-plan');
  pdf.setCreator('Free Period test fixture generator');
  pdf.setProducer('pdf-lib');
  pdf.setCreationDate(FIXED_DATE);
  pdf.setModificationDate(FIXED_DATE);

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const pages = Array.from({ length: 10 }, () => pdf.addPage(PAGE_SIZE));

  /** @param {number} i @param {string} title @param {number} [size] */
  function header(i, title, size = 16) {
    const page = pages[i];
    page.drawText(title, { x: MARGIN, y: 572, size, font: bold, color: BLACK });
    page.drawText(`-- ${i + 1} of 10 --`, {
      x: 680,
      y: 24,
      size: 9,
      font,
      color: BLACK,
    });
  }

  /** @param {import('pdf-lib').PDFPage} page @param {string} text @param {number} x @param {number} y @param {number} [size] */
  function label(page, text, x, y, size = 11) {
    page.drawText(text, { x, y, size, font, color: BLACK });
  }

  /** @param {import('pdf-lib').PDFPage} page @param {string[]} items @param {number} startY */
  function checkList(page, items, startY) {
    let y = startY;
    for (const item of items) {
      drawCheckbox(page, MARGIN, y);
      label(page, item, MARGIN + 14, y, 10);
      y -= 18;
    }
  }

  header(0, 'Formal Lesson Plan Template');
  label(pages[0], 'Subject:', MARGIN, 540);
  label(pages[0], 'Timetable Reference', 280, 540);
  label(pages[0], 'Lesson Title', MARGIN, 510);
  label(pages[0], 'Date', 280, 510);
  label(pages[0], 'Period', 480, 510);
  label(pages[0], 'Teacher', MARGIN, 480);
  label(pages[0], 'Grade/Class', 280, 480);
  label(pages[0], 'Duration', 480, 480);
  label(pages[0], 'Stream', 640, 480);
  label(
    pages[0],
    'Curriculum Standards (CS) / Assessment Information (based on the last summative/formal assessment)',
    MARGIN,
    440,
    10,
  );
  label(pages[0], 'Current Level (all students)', MARGIN, 400);
  label(pages[0], 'Above CS', MARGIN, 370);
  label(pages[0], 'In line with CS', 200, 370);
  label(pages[0], 'Below CS', 400, 370);
  label(pages[0], 'Ability Range', 560, 370);

  header(1, 'Planning and Pedagogical Approach');
  label(pages[1], 'Group / Demographic / Role', MARGIN, 540);
  label(pages[1], 'SEN', MARGIN, 510);
  label(pages[1], 'G&T', 200, 510);
  label(pages[1], 'Attending SEN', 360, 510);
  label(pages[1], 'Attending G&T', 540, 510);
  label(pages[1], 'Targeted Students / Groups', MARGIN, 470);
  label(
    pages[1],
    'Number of students who will receive targeted intervention during this lesson.',
    MARGIN,
    440,
    10,
  );
  label(pages[1], 'Number:', MARGIN, 410);
  label(
    pages[1],
    '(Please put the reason(s) into the Adaptive Teaching / Differentiation)',
    140,
    410,
    10,
  );
  label(pages[1], 'Strengths / Weaknesses / Challenges', MARGIN, 370);
  label(
    pages[1],
    "Overall strengths and weaknesses (based on teacher's knowledge of students' attainment/progress/learning skills):",
    MARGIN,
    340,
    10,
  );

  header(2, 'Learning Objectives');
  label(pages[2], 'What are learners expected to master during the lesson?', MARGIN, 540, 10);
  label(pages[2], 'These should be specific and measurable.', MARGIN, 522, 10);
  label(pages[2], 'Essential Question(s)', MARGIN, 480);
  label(pages[2], 'New Vocabulary (if any)', MARGIN, 400);

  header(3, 'Targeted Learning Skills');
  label(pages[3], 'Please highlight all that apply:', MARGIN, 540, 10);
  checkList(pages[3], SKILL_CHECKS, 510);

  header(4, 'Teaching Strategies');
  label(pages[4], 'Please highlight all that apply:', MARGIN, 540, 10);
  checkList(pages[4], STRATEGY_CHECKS, 510);
  label(pages[4], "If 'Other' please specify:", MARGIN, 200);

  header(5, 'Formative Assessment Methods');
  label(pages[5], 'Please highlight all that apply:', MARGIN, 540, 10);
  checkList(pages[5], ASSESSMENT_CHECKS, 510);
  label(pages[5], 'Adaptive Teaching / Differentiation', MARGIN, 270, 12);
  label(
    pages[5],
    'Strategies to ensure that the needs of all learners are met (intervention & acceleration).',
    MARGIN,
    248,
    10,
  );
  label(pages[5], 'Adapted instruction to meet the needs of SEN, LS, and G&T students', MARGIN, 230, 10);
  label(pages[5], 'Prior knowledge:', MARGIN, 200);
  label(pages[5], 'Working Towards Mastery (all):', MARGIN, 180);
  label(pages[5], 'Working At Mastery (most):', MARGIN, 160);
  label(pages[5], 'Mastery with Greater Depth (some):', MARGIN, 140);
  label(pages[5], 'Other adaptive teaching strategies:', MARGIN, 120);
  label(
    pages[5],
    'Special Educational Needs (SEN registered), Learning Support (LS), Gifted & Talented (G&T):',
    MARGIN,
    100,
    10,
  );

  header(6, 'Innovation / 21st Century Skills / Global Competencies');
  label(pages[6], 'Please highlight all that apply:', MARGIN, 540, 10);
  checkList(pages[6], INNOVATION_CHECKS, 510);
  label(pages[6], 'Digital Pedagogy & Tool Integration', MARGIN, 240, 12);
  label(pages[6], 'Is a digital tool required? Yes / No', MARGIN, 218);
  label(pages[6], 'Higher Order Thinking Skills', MARGIN, 190);
  label(pages[6], 'Cross Curricular Links (where/when applicable)', MARGIN, 160);

  header(7, 'Seating Arrangements');
  label(pages[7], 'Please highlight all that apply:', MARGIN, 540, 10);
  checkList(pages[7], SEATING_CHECKS, 510);
  label(pages[7], 'Time', MARGIN, 340);
  label(pages[7], 'Teacher activity', 140, 340);
  label(pages[7], 'Learner activity & Success Criteria', 320, 340);
  label(pages[7], 'Formative assessment', 540, 340);
  label(pages[7], 'Learning materials / resources', MARGIN, 310);

  header(8, 'Lesson sequence');
  label(pages[8], 'Do Now (Starter Activity)', MARGIN, 540);
  label(pages[8], 'Activation (Introducing New Content)', MARGIN, 470);
  label(pages[8], 'Student Participation:', MARGIN, 440);
  label(pages[8], 'Differentiation:', MARGIN, 410);
  label(pages[8], 'Formal Introduction:', MARGIN, 380);
  label(pages[8], 'Demonstration of Learning (Practice)', MARGIN, 340);
  label(pages[8], 'Differentiated Activities/Worksheets:', MARGIN, 310);
  label(pages[8], '[1] Working Towards Mastery:', MARGIN, 280);
  label(pages[8], '[2] Working at Mastery:', MARGIN, 250);
  label(pages[8], '[3] Mastery with Greater Depth:', MARGIN, 220);

  header(9, 'Consolidation / Review');
  label(pages[9], 'Class Discussion:', MARGIN, 540);
  label(pages[9], 'Plenary: Review questions & Exit Ticket', MARGIN, 510);
  label(pages[9], 'Homework Differentiation (Based on Exit Ticket Responses)', MARGIN, 470);
  label(pages[9], 'Working Towards Mastery:', MARGIN, 440);
  label(pages[9], 'Working At Mastery:', MARGIN, 410);
  label(pages[9], 'Mastery with Greater Depth:', MARGIN, 380);
  label(pages[9], 'Extension:', MARGIN, 350);
  label(pages[9], 'Formative Data:', MARGIN, 310);
  label(pages[9], 'Self-Reflection: Data-informed future planning:', MARGIN, 250);

  const bytes = await pdf.save();
  writeFileSync(OUT, bytes);
  console.log(`Wrote ${OUT} (${bytes.length} bytes, ${pdf.getPageCount()} pages)`);
}

await main();
