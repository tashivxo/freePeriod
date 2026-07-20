import fs from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { generateLessonContent } from '@/lib/generation/generate-content';
import { generateDocx } from '@/lib/export/docx';
import {
  compareTableGridsToTemplate,
  docxUsesFixedTableLayout,
  summarizeDocxStructure,
} from '@/lib/export/docx-structure';
import {
  estimateClaudeCostUsd,
  logPaidGenerationUsage,
  OBSERVATION_TEMPLATE_PATH,
  PAID_GENERATION_OUTPUT_DIR,
  PAID_GENERATION_SAMPLE,
} from '@/lib/test/paid-generation-sample';
import { isLocalDevRouteAllowed, localDevRouteBlockedResponse } from '@/lib/test/local-dev-route';
import type { LessonPlan } from '@/types';
import JSZip from 'jszip';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const OUTPUT_DOCX = 'paid-claude-lesson-plan.docx';
const OUTPUT_REPORT = 'comparison-report.json';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function serveSavedDocx(filename: string): Promise<Response> {
  const safeName = path.basename(filename);
  const filePath = path.join(PAID_GENERATION_OUTPUT_DIR, safeName);
  const buffer = await fs.readFile(filePath);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${safeName}"`,
    },
  });
}

export async function GET(request: NextRequest) {
  if (!isLocalDevRouteAllowed(request)) {
    return localDevRouteBlockedResponse();
  }

  const download = request.nextUrl.searchParams.get('download');
  if (download) {
    try {
      return await serveSavedDocx(download);
    } catch {
      return NextResponse.json({ error: 'File not found. Run generation first.' }, { status: 404 });
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not set in .env.local' },
      { status: 500 },
    );
  }

  try {
    return await runPaidGenerationTest();
  } catch (err) {
    console.error('[test-paid-generation] Failed:', err);
    const message = err instanceof Error ? err.message : String(err);
    return new NextResponse(
      `<!DOCTYPE html><html><body><h1>Paid generation test failed</h1><pre>${escapeHtml(message)}</pre></body></html>`,
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }
}

async function runPaidGenerationTest(): Promise<Response> {
  const startedAt = Date.now();
  console.log('[test-paid-generation] Starting paid Claude generation…');
  console.log('[test-paid-generation] Sample prompt:', PAID_GENERATION_SAMPLE);

  const generated = await generateLessonContent({
    generationMode: PAID_GENERATION_SAMPLE.generationMode,
    subject: PAID_GENERATION_SAMPLE.subject,
    grade: PAID_GENERATION_SAMPLE.grade,
    curriculum: PAID_GENERATION_SAMPLE.curriculum,
    duration: PAID_GENERATION_SAMPLE.duration,
    teacherPrompt: PAID_GENERATION_SAMPLE.teacherPrompt,
  });

  const cost = estimateClaudeCostUsd({
    inputTokens: generated.inputTokens,
    outputTokens: generated.outputTokens,
  });
  logPaidGenerationUsage(generated.modelUsed, cost);

  const lesson: LessonPlan = {
    id: 'test-paid-generation',
    user_id: 'local-dev',
    title: generated.lessonContent.title,
    subject: PAID_GENERATION_SAMPLE.subject,
    grade: PAID_GENERATION_SAMPLE.grade,
    curriculum: PAID_GENERATION_SAMPLE.curriculum,
    duration_minutes: PAID_GENERATION_SAMPLE.duration,
    content: generated.lessonContent,
    model_used: generated.modelUsed,
    token_count: generated.inputTokens + generated.outputTokens,
    template_path: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const docxBuffer = await generateDocx(lesson);
  const structure = await summarizeDocxStructure(docxBuffer);
  const zip = await JSZip.loadAsync(docxBuffer);
  const xml = (await zip.file('word/document.xml')?.async('string')) ?? '';
  const fixedLayout = docxUsesFixedTableLayout(xml);

  let templateComparison: {
    templatePath: string;
    templateFound: boolean;
    gridIssues: string[];
    templateTableCount: number | null;
  } = {
    templatePath: OBSERVATION_TEMPLATE_PATH,
    templateFound: false,
    gridIssues: [],
    templateTableCount: null,
  };

  try {
    await fs.access(OBSERVATION_TEMPLATE_PATH);
    templateComparison.templateFound = true;
    const templateBuffer = await fs.readFile(OBSERVATION_TEMPLATE_PATH);
    const templateStructure = await summarizeDocxStructure(templateBuffer);
    templateComparison.templateTableCount = templateStructure.tableCount;
    templateComparison.gridIssues = compareTableGridsToTemplate(
      structure.tables,
      templateStructure.tables.slice(0, 5),
    );
  } catch {
    templateComparison.gridIssues = ['Observation template file not found — skipped grid comparison'];
  }

  const structureChecksPassed =
    structure.tableCount === 5 &&
    fixedLayout &&
    Object.values(structure.headers).every(Boolean);

  const templateGridPassed =
    templateComparison.templateFound && templateComparison.gridIssues.length === 0;

  const comparisonPassed = structureChecksPassed && (!templateComparison.templateFound || templateGridPassed);

  await fs.mkdir(PAID_GENERATION_OUTPUT_DIR, { recursive: true });
  const docxPath = path.join(PAID_GENERATION_OUTPUT_DIR, OUTPUT_DOCX);
  await fs.writeFile(docxPath, docxBuffer);

  const report = {
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    sample: PAID_GENERATION_SAMPLE,
    modelUsed: generated.modelUsed,
    tokenUsage: cost,
    lessonTitle: lesson.title,
    docxPath,
    structure: {
      tableCount: structure.tableCount,
      headers: structure.headers,
      fixedLayout,
      tables: structure.tables,
    },
    templateComparison,
    comparisonPassed,
  };

  const reportPath = path.join(PAID_GENERATION_OUTPUT_DIR, OUTPUT_REPORT);
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

  console.log('[test-paid-generation] DOCX saved:', docxPath);
  console.log('[test-paid-generation] Comparison report:', reportPath);
  console.log('[test-paid-generation] Table count:', structure.tableCount, '(expected 5)');
  console.log('[test-paid-generation] Template grid issues:', templateComparison.gridIssues);
  console.log('[test-paid-generation] Comparison passed:', comparisonPassed);

  const downloadUrl = `/test-paid-generation?download=${encodeURIComponent(OUTPUT_DOCX)}`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Paid generation test</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
    .ok { color: #166534; }
    .warn { color: #92400e; }
    pre { background: #f4f4f5; padding: 1rem; overflow: auto; border-radius: 8px; font-size: 0.875rem; }
    a.button { display: inline-block; margin: 1rem 0; padding: 0.75rem 1.25rem; background: #18181b; color: #fff; text-decoration: none; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>Paid lesson plan generation test</h1>
  <p class="${comparisonPassed ? 'ok' : 'warn'}">
    <strong>${comparisonPassed ? 'Comparison passed' : 'Comparison has issues'}</strong>
    — ${structure.tableCount} tables, fixed layout: ${fixedLayout ? 'yes' : 'no'}
  </p>
  <p><a class="button" href="${downloadUrl}">Download DOCX</a></p>
  <h2>Claude usage</h2>
  <ul>
    <li>Model: ${escapeHtml(generated.modelUsed)}</li>
    <li>Input tokens: ${cost.inputTokens}</li>
    <li>Output tokens: ${cost.outputTokens}</li>
    <li>Estimated cost: $${cost.estimatedCostUsd.toFixed(6)} USD</li>
    <li>Generation time: ${((Date.now() - startedAt) / 1000).toFixed(1)}s</li>
  </ul>
  <h2>Lesson</h2>
  <p><strong>${escapeHtml(lesson.title)}</strong></p>
  <h2>Template comparison</h2>
  <pre>${escapeHtml(JSON.stringify(templateComparison, null, 2))}</pre>
  <h2>Saved files</h2>
  <ul>
    <li>${escapeHtml(docxPath)}</li>
    <li>${escapeHtml(reportPath)}</li>
  </ul>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
