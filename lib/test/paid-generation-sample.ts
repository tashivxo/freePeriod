import path from 'path';

export const PAID_GENERATION_SAMPLE = {
  subject: 'Mathematics',
  grade: '10',
  curriculum: 'CAPS (South Africa)',
  duration: 60,
  teacherPrompt: [
    'Topic: linear equations and straight-line graphs.',
    'Learners should plot graphs from equations, interpret gradient and y-intercept, and solve simple word problems.',
    'Include a short DO NOW, pair work, and an exit ticket suitable for a formal lesson observation.',
    'Differentiate for learners who struggle with negative gradients and extend for learners ready for simultaneous equations.',
    'Reference Grade 10 CAPS Mathematics terminology where appropriate.',
  ].join('\n'),
  modelPreference: 'claude-sonnet-4-6' as const,
};

export const PAID_GENERATION_OUTPUT_DIR = path.resolve(
  process.cwd(),
  'test-results/paid-generation',
);

export const OBSERVATION_TEMPLATE_PATH = path.resolve(
  process.env.OBSERVATION_LESSON_TEMPLATE ??
    'C:/Users/tashi/Downloads/observation_lesson_plan_updated.docx',
);

/** USD per million tokens — Sonnet 4.6 list pricing (Mar 2026). */
export const CLAUDE_SONNET_46_RATES = {
  inputPerMillion: 3,
  outputPerMillion: 15,
  cacheReadPerMillion: 0.3,
  cacheWritePerMillion: 3.75,
} as const;

export type TokenCostBreakdown = {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
  estimatedCostUsd: number;
};

export function estimateClaudeCostUsd(usage: {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens?: number;
  cacheCreationInputTokens?: number;
}): TokenCostBreakdown {
  const cacheReadInputTokens = usage.cacheReadInputTokens ?? 0;
  const cacheCreationInputTokens = usage.cacheCreationInputTokens ?? 0;
  const billableInput = Math.max(0, usage.inputTokens - cacheReadInputTokens - cacheCreationInputTokens);

  const estimatedCostUsd =
    (billableInput / 1_000_000) * CLAUDE_SONNET_46_RATES.inputPerMillion +
    (cacheReadInputTokens / 1_000_000) * CLAUDE_SONNET_46_RATES.cacheReadPerMillion +
    (cacheCreationInputTokens / 1_000_000) * CLAUDE_SONNET_46_RATES.cacheWritePerMillion +
    (usage.outputTokens / 1_000_000) * CLAUDE_SONNET_46_RATES.outputPerMillion;

  return {
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    cacheReadInputTokens,
    cacheCreationInputTokens,
    estimatedCostUsd: Math.round(estimatedCostUsd * 1_000_000) / 1_000_000,
  };
}

export function logPaidGenerationUsage(
  modelUsed: string,
  cost: TokenCostBreakdown,
): void {
  console.log('[test-paid-generation] Claude usage');
  console.log(`  Model: ${modelUsed}`);
  console.log(`  Input tokens: ${cost.inputTokens}`);
  console.log(`  Output tokens: ${cost.outputTokens}`);
  if (cost.cacheReadInputTokens > 0) {
    console.log(`  Cache read tokens: ${cost.cacheReadInputTokens}`);
  }
  if (cost.cacheCreationInputTokens > 0) {
    console.log(`  Cache write tokens: ${cost.cacheCreationInputTokens}`);
  }
  console.log(`  Estimated cost (USD): $${cost.estimatedCostUsd.toFixed(6)}`);
}
