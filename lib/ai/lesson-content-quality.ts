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
    '"The lesson develops students\' ability to explain the topic using the concepts and vocabulary specified in the supplied curriculum guidance."',
  misconceptions:
    '"Students often think particles stop moving in solids — addressed by comparing particle vibration models."',
  sciencePractices: '"Using evidence from lesson activities to explain the target concept and communicate reasoning clearly."',
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

function synthesizeAlignmentStatements(content: LessonSection): string[] {
  if (content.objectives.length === 0) {
    return [
      `Students demonstrate understanding of ${content.title} by applying lesson concepts accurately in guided and independent tasks.`,
    ];
  }

  return content.objectives.map((objective) => {
    const statement = objective.replace(/^Students will /i, 'Students demonstrate that they can ');
    return `Students demonstrate the curriculum-aligned learning described by this objective: ${statement}`;
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

  if (/model|diagram|represent/.test(blob)) {
    practices.push('Using diagrams or other representations to make sense of the lesson ideas.');
  }
  if (/investigat|experiment|observe|station/.test(blob)) {
    practices.push('Gathering observations during lesson activities and using them to check understanding.');
  }
  if (/analyz|interpre|data|classif|compar/.test(blob)) {
    practices.push('Comparing information from lesson tasks to identify patterns and support conclusions.');
  }
  if (/discuss|explain|justify|reason|write/.test(blob)) {
    practices.push('Explaining ideas clearly in discussion and written responses using lesson evidence.');
  }

  if (practices.length < MIN_PLANNING_ARRAY_ITEMS) {
    practices.push(
      'Using evidence from lesson activities to explain the target concept and communicate reasoning clearly.',
      'Applying lesson ideas during guided practice, independent work, and class discussion.',
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
    enriched.performanceExpectations = synthesizeAlignmentStatements(enriched);
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
      enriched.keyConcepts = synthesizeAlignmentStatements(enriched).slice(0, 3);
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
  curriculumText?: string;
};

/** Colon, em dash, en dash, or hyphen used after a PE/LO/SO/AO prefix. */
const IDENTIFIER_PREFIX_SEPARATORS = '[:—–-]';

const STANDARDS_IDENTIFIER_PATTERN = new RegExp(
  String.raw`\b(?:` +
    // Real prefix tokens only (not COVID-19:, Year-12:, etc.), including em dash prefixes.
    String.raw`(?:PE|LO|SO|AO)-\d{1,4}(?=\s*` +
    IDENTIFIER_PREFIX_SEPARATORS +
    ')' +
    // NGSS and grade-band codes: MS-PS1-4, 5-PS1-1, 3-5-ETS1-1, K-2-ETS1-1
    String.raw`|(?:K|\d{1,2}|MS|HS)(?:-(?:K|\d{1,2}))?-[A-Z]{2,8}\d{0,2}-\d{1,2}[A-Z]?` +
    // Common Core math-style dotted codes: 5.NBT.3, 6.EE.A.1, K.CC.1
    String.raw`|(?:K|\d{1,2}|HS)(?:\.[A-Z]{1,6})+(?:\.[A-Z0-9]{1,4})+` +
    // Letter-first dotted codes (RL.5.3). Requires numeric segments so U.S.A. / Q.1.a / Fig.1.2 do not match.
    String.raw`|(?!(?:FIG|EQ|VOL|CH|NO|VS|SEC|REF|TAB|EX)\.)[A-Z]{1,8}\.\d+[A-Z]?(?:\.\d+[A-Z]?)+` +
    String.raw`)\b`,
  'gi',
);

function normalizeIdentifier(identifier: string): string {
  return identifier.replace(/[^A-Za-z0-9.-]/g, '').toUpperCase();
}

function getCurriculumIdentifiers(curriculumText?: string): Set<string> {
  if (!curriculumText) return new Set();

  return new Set(
    (curriculumText.match(STANDARDS_IDENTIFIER_PATTERN) ?? []).map(normalizeIdentifier),
  );
}

/**
 * Keep identifier-shaped text only when it came from the teacher's curriculum source.
 * Plain-language alignment remains useful without a document, but fabricated codes do not.
 */
export function sanitizeCurriculumIdentifiers(
  items: string[] | undefined,
  curriculumText?: string,
): string[] | undefined {
  if (!items) return items;

  const allowed = getCurriculumIdentifiers(curriculumText);

  return items
    .map((item) => {
      let sanitized = String(item);
      const identifiers = sanitized.match(STANDARDS_IDENTIFIER_PATTERN) ?? [];

      for (const identifier of identifiers) {
        if (!allowed.has(normalizeIdentifier(identifier))) {
          const escaped = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          sanitized = sanitized
            .replace(new RegExp(`^\\s*${escaped}\\s*${IDENTIFIER_PREFIX_SEPARATORS}\\s*`, 'i'), '')
            .replace(new RegExp(`\\b${escaped}\\b`, 'gi'), '');
        }
      }

      return sanitized.replace(/\s{2,}/g, ' ').replace(/\s+([,.;])/g, '$1').trim();
    })
    .filter(Boolean);
}

export function sanitizeLessonCurriculumIdentifiers(
  content: LessonSection,
  curriculumText?: string,
): LessonSection {
  const sanitizeString = (value: string): string =>
    sanitizeCurriculumIdentifiers([value], curriculumText)?.[0] ?? '';
  const sanitizeList = (value: string[] | undefined): string[] | undefined =>
    value ? sanitizeCurriculumIdentifiers(value, curriculumText) : value;

  return {
    ...content,
    title: sanitizeString(content.title),
    essentialQuestion: content.essentialQuestion
      ? sanitizeString(content.essentialQuestion)
      : content.essentialQuestion,
    objectives: sanitizeList(content.objectives) ?? [],
    successCriteria: sanitizeList(content.successCriteria) ?? [],
    priorKnowledge: sanitizeList(content.priorKnowledge),
    performanceExpectations: sanitizeList(content.performanceExpectations),
    misconceptions: sanitizeList(content.misconceptions),
    sciencePractices: sanitizeList(content.sciencePractices),
    keyConcepts: sanitizeList(content.keyConcepts) ?? [],
    vocabulary: sanitizeList(content.vocabulary),
    hook: sanitizeString(content.hook),
    mainActivities: sanitizeList(content.mainActivities) ?? [],
    guidedPractice: sanitizeList(content.guidedPractice) ?? [],
    independentPractice: sanitizeList(content.independentPractice) ?? [],
    formativeAssessment: sanitizeList(content.formativeAssessment) ?? [],
    differentiation: {
      support: sanitizeList(content.differentiation.support) ?? [],
      extension: sanitizeList(content.differentiation.extension) ?? [],
    },
    realWorldConnections: sanitizeList(content.realWorldConnections) ?? [],
    plenary: sanitizeString(content.plenary),
  };
}

export async function finalizeLessonContent(
  content: LessonSection,
  options: FinalizeLessonContentOptions,
): Promise<LessonSection> {
  let current = content;
  const initialFailures = getLessonContentValidationFailures(current);

  if (initialFailures.length > 0 && options.retry) {
    const retryPrompt = buildPlanningFieldsRetryPrompt(initialFailures, current);
    const sourceInstruction = options.curriculumText
      ? '\nUse only standards identifiers that appear verbatim in the uploaded curriculum document.'
      : '\nDo not include standards identifiers because no curriculum document was supplied.';
    const patch = await options.retry(`${retryPrompt}${sourceInstruction}`);
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
    return sanitizeLessonCurriculumIdentifiers(enriched, options.curriculumText);
  }

  return sanitizeLessonCurriculumIdentifiers(current, options.curriculumText);
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
