import type { LessonSection } from '@/types';

export const MIN_PLANNING_ARRAY_ITEMS = 2;
export const MIN_EXPLANATION_ITEM_LENGTH = 15;
export const MIN_SENTENCE_LENGTH = 40;

export type PlanningValidationField =
  | 'priorKnowledge'
  | 'performanceExpectations'
  | 'misconceptions'
  | 'sciencePractices'
  | 'keyConcepts'
  | 'vocabulary';

const PLANNING_ARRAY_FIELDS: PlanningValidationField[] = [
  'priorKnowledge',
  'performanceExpectations',
  'misconceptions',
  'sciencePractices',
];

function hasExplanationSeparator(text: string): boolean {
  return /[—–]/.test(text) || /\s-\s/.test(text);
}

export function isRichExplanationItem(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < MIN_EXPLANATION_ITEM_LENGTH) return false;
  if (hasExplanationSeparator(trimmed)) return true;
  return trimmed.split(/\s+/).length >= 4;
}

export function isRichExplanationList(items: string[] | undefined): boolean {
  if (!items?.length || items.length < MIN_PLANNING_ARRAY_ITEMS) return false;
  return items.every(isRichExplanationItem);
}

export function isSubstantiveSentenceList(items: string[] | undefined): boolean {
  if (!items?.length || items.length < MIN_PLANNING_ARRAY_ITEMS) return false;
  return items.every((item) => item.trim().length >= MIN_SENTENCE_LENGTH);
}

export function getLessonContentValidationFailures(content: LessonSection): PlanningValidationField[] {
  const failures: PlanningValidationField[] = [];

  for (const field of PLANNING_ARRAY_FIELDS) {
    if (!isSubstantiveSentenceList(content[field])) {
      failures.push(field);
    }
  }

  if (!isRichExplanationList(content.keyConcepts)) {
    failures.push('keyConcepts');
  }

  if (!isRichExplanationList(content.vocabulary)) {
    failures.push('vocabulary');
  }

  return failures;
}

const FIELD_EXAMPLES: Record<PlanningValidationField, string> = {
  priorKnowledge: '"Students should already understand that all matter is made of particles in constant motion."',
  performanceExpectations:
    '"MS-PS1-4: Develop a model that predicts changes in particle motion when thermal energy is added or removed."',
  misconceptions:
    '"Students often think particles stop moving in solids — addressed by comparing particle vibration models."',
  sciencePractices: '"Developing and using models to represent particle arrangement in different states of matter."',
  keyConcepts: '"Particle motion — particles move faster when thermal energy increases and slower when it decreases."',
  vocabulary: '"Phase — a distinct form of matter such as solid, liquid, or gas."',
};

export function buildPlanningFieldsRetryPrompt(
  failures: PlanningValidationField[],
  content: LessonSection,
): string {
  const currentValues = Object.fromEntries(
    failures.map((field) => [field, content[field as keyof LessonSection]]),
  );

  const examples = failures.map((field) => `- ${field}: ${FIELD_EXAMPLES[field]}`).join('\n');

  return `The lesson plan JSON you returned is missing substantive content in these planning fields: ${failures.join(', ')}.

Current values (too brief or empty):
${JSON.stringify(currentValues, null, 2)}

Return a JSON object containing ONLY these keys with corrected values. Each array must have at least ${MIN_PLANNING_ARRAY_ITEMS} items.

Required format examples:
${examples}

Do not return markdown fences or any keys other than: ${failures.join(', ')}.`;
}

export function mergePlanningFieldRetry(
  base: LessonSection,
  patch: Partial<LessonSection>,
): LessonSection {
  const merged = { ...base };

  for (const field of [...PLANNING_ARRAY_FIELDS, 'keyConcepts', 'vocabulary'] as const) {
    const value = patch[field];
    if (Array.isArray(value) && value.length > 0) {
      merged[field] = value.map(String);
    }
  }

  return merged;
}

function expandThinConcept(term: string, content: LessonSection): string {
  const trimmed = term.trim();
  if (isRichExplanationItem(trimmed)) return trimmed;
  const anchor = content.objectives[0] ?? content.essentialQuestion ?? content.title;
  return `${trimmed} — a core idea students explore in this lesson, connected to ${anchor.replace(/\.$/, '')}.`;
}

function expandThinVocabulary(term: string): string {
  const trimmed = term.trim();
  if (isRichExplanationItem(trimmed)) return trimmed;
  const word = trimmed.split(/[—–-]/)[0]?.trim() || trimmed;
  return `${word} — key vocabulary students use to describe and explain ideas in this lesson.`;
}

function synthesizePriorKnowledge(content: LessonSection, title: string): string[] {
  const topic = content.title || title;
  return [
    `Students should already understand foundational concepts related to ${topic}, including vocabulary and ideas from earlier lessons in this unit.`,
    `Students should be able to follow multi-step instructions, work collaboratively in small groups, and record observations using structured organisers or notebooks.`,
    `Students should be familiar with making predictions, comparing observations, and supporting claims with evidence from classroom activities.`,
  ];
}

function synthesizePerformanceExpectations(content: LessonSection): string[] {
  if (content.objectives.length === 0) {
    return [
      `Students demonstrate understanding of ${content.title} by applying lesson concepts accurately in guided and independent tasks.`,
    ];
  }

  return content.objectives.map((objective, index) => {
    const statement = objective.replace(/^Students will /i, 'Students demonstrate that they can ');
    return `PE-${index + 1}: ${statement}`;
  });
}

function synthesizeMisconceptions(content: LessonSection, title: string): string[] {
  const topic = content.title || title;
  return [
    `Students may hold everyday misconceptions about ${topic} that differ from scientific explanations — this lesson addresses these through modelling, questioning, and evidence-based discussion.`,
    `Students may confuse related vocabulary terms — addressed through explicit definitions, examples, and formative checks during activities.`,
  ];
}

function synthesizeSciencePractices(content: LessonSection): string[] {
  const blob = JSON.stringify(content).toLowerCase();
  const practices: string[] = [];

  if (/model|diagram/.test(blob)) {
    practices.push('Developing and using models to represent key concepts and relationships in this lesson.');
  }
  if (/investigat|experiment|observe|station/.test(blob)) {
    practices.push('Planning and carrying out investigations through structured observations and guided inquiry tasks.');
  }
  if (/analyz|interpre|data|classif/.test(blob)) {
    practices.push('Analyzing and interpreting data collected during activities to draw evidence-based conclusions.');
  }
  if (/explain|justify|reason|argument/.test(blob)) {
    practices.push('Constructing explanations and designing solutions using evidence gathered in the lesson.');
  }

  if (practices.length < MIN_PLANNING_ARRAY_ITEMS) {
    practices.push(
      'Asking questions and defining problems based on observations and lesson phenomena.',
      'Engaging in argument from evidence during class discussion and written responses.',
    );
  }

  return practices.slice(0, 4);
}

export function enrichThinLessonContent(
  content: LessonSection,
  title: string,
): { content: LessonSection; enrichedFields: string[] } {
  const enriched: LessonSection = { ...content };
  const enrichedFields: string[] = [];

  if (!isSubstantiveSentenceList(enriched.priorKnowledge)) {
    enriched.priorKnowledge = synthesizePriorKnowledge(enriched, title);
    enrichedFields.push('priorKnowledge');
  }

  if (!isSubstantiveSentenceList(enriched.performanceExpectations)) {
    enriched.performanceExpectations = synthesizePerformanceExpectations(enriched);
    enrichedFields.push('performanceExpectations');
  }

  if (!isSubstantiveSentenceList(enriched.misconceptions)) {
    enriched.misconceptions = synthesizeMisconceptions(enriched, title);
    enrichedFields.push('misconceptions');
  }

  if (!isSubstantiveSentenceList(enriched.sciencePractices)) {
    enriched.sciencePractices = synthesizeSciencePractices(enriched);
    enrichedFields.push('sciencePractices');
  }

  if (!isRichExplanationList(enriched.keyConcepts)) {
    enriched.keyConcepts = (enriched.keyConcepts ?? []).map((item) => expandThinConcept(item, enriched));
    if (enriched.keyConcepts.length < MIN_PLANNING_ARRAY_ITEMS) {
      enriched.keyConcepts = synthesizePerformanceExpectations(enriched).slice(0, 3);
    }
    enrichedFields.push('keyConcepts');
  }

  if (!isRichExplanationList(enriched.vocabulary)) {
    enriched.vocabulary = (enriched.vocabulary ?? []).map(expandThinVocabulary);
    if ((enriched.vocabulary?.length ?? 0) < MIN_PLANNING_ARRAY_ITEMS) {
      enriched.vocabulary = [
        'Concept — key idea vocabulary used throughout the lesson.',
        'Evidence — observations or data used to support scientific explanations.',
      ];
    }
    enrichedFields.push('vocabulary');
  }

  return { content: enriched, enrichedFields };
}

export type FinalizeLessonContentOptions = {
  title: string;
  retry?: (retryPrompt: string) => Promise<Partial<LessonSection> | null>;
};

export async function finalizeLessonContent(
  content: LessonSection,
  options: FinalizeLessonContentOptions,
): Promise<LessonSection> {
  let current = content;
  const initialFailures = getLessonContentValidationFailures(current);

  if (initialFailures.length > 0 && options.retry) {
    const patch = await options.retry(buildPlanningFieldsRetryPrompt(initialFailures, current));
    if (patch) {
      current = mergePlanningFieldRetry(current, patch);
    }
  }

  const remainingFailures = getLessonContentValidationFailures(current);
  if (remainingFailures.length > 0) {
    const { content: enriched, enrichedFields } = enrichThinLessonContent(current, options.title);
    if (enrichedFields.length > 0) {
      console.warn('[lesson-content] Applied fallback enrichment for thin planning fields', {
        enrichedFields,
        remainingFailures,
      });
    }
    return enriched;
  }

  return current;
}

export function parsePlanningFieldPatch(text: string): Partial<LessonSection> | null {
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonSource = cleaned.startsWith('{') ? cleaned : cleaned.match(/\{[\s\S]*\}/)?.[0];
    if (!jsonSource) return null;

    const parsed = JSON.parse(jsonSource) as Partial<LessonSection>;
    return parsed;
  } catch {
    return null;
  }
}
