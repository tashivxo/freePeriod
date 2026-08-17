import { ADEK_PACK } from './adek';
import { AQA_PACK } from './aqa';
import { CAMBRIDGE_A_LEVEL_PACK } from './cambridge-a-level';
import { CAMBRIDGE_IGCSE_PACK } from './cambridge-igcse';
import { CAPS_PACK } from './caps';
import { CBSE_PACK } from './cbse';
import { COMMON_CORE_PACK } from './common-core';
import { EDEXCEL_PACK } from './edexcel';
import { GCSE_PACK } from './gcse';
import { OCR_PACK } from './ocr';
import type { CurriculumPack } from './types';
import { UAE_MOE_PACK } from './uae-moe';

const PACKS: CurriculumPack[] = [
  UAE_MOE_PACK,
  ADEK_PACK,
  CAMBRIDGE_IGCSE_PACK,
  CAMBRIDGE_A_LEVEL_PACK,
  CAPS_PACK,
  CBSE_PACK,
  COMMON_CORE_PACK,
  GCSE_PACK,
  AQA_PACK,
  EDEXCEL_PACK,
  OCR_PACK,
];

export type { CurriculumPack } from './types';

export function getCurriculumPack(curriculum: string): CurriculumPack | null {
  const normalized = curriculum.trim();
  if (!normalized) return null;

  return (
    PACKS.find((pack) =>
      pack.curriculumValues.some((value) => value.trim() === normalized),
    ) ?? null
  );
}

const SUBJECT_NOTE_ALIASES: Record<string, string[]> = {
  science: ['biology', 'chemistry', 'physics'],
  'islamic education': ['islamic studies', 'religious education'],
  'social studies': ['history', 'geography'],
};

function findSubjectNotes(pack: CurriculumPack, subject: string): string[] | undefined {
  if (!pack.subjectNotes) return undefined;

  const normalizedSubject = subject.trim().toLowerCase();
  if (!normalizedSubject) return undefined;

  for (const [key, notes] of Object.entries(pack.subjectNotes)) {
    if (key.trim().toLowerCase() === normalizedSubject) {
      return notes;
    }
  }

  for (const [key, notes] of Object.entries(pack.subjectNotes)) {
    const aliases = SUBJECT_NOTE_ALIASES[key.trim().toLowerCase()] ?? [];
    if (aliases.includes(normalizedSubject)) {
      return notes;
    }
  }

  return undefined;
}

function formatBulletSection(title: string, items: string[]): string {
  return `${title}:\n${items.map((item) => `- ${item}`).join('\n')}`;
}

export function formatCurriculumPackForPrompt(
  pack: CurriculumPack,
  subject: string,
  grade: string,
): string {
  const lines: string[] = [
    `Guideline pack: ${pack.displayName} (${pack.authority})`,
    `Coverage: ${pack.coverage} only — not an official curriculum document.`,
    `Last reviewed: ${pack.lastReviewed}`,
    `Grade context: ${grade.trim() || 'unspecified'}`,
    `Subject context: ${subject.trim() || 'unspecified'}`,
    '',
    'Do not invent official outcome or standards codes. Do not cite these notes as official curriculum documents.',
    '',
    formatBulletSection('Applicability', pack.applicability),
    '',
    formatBulletSection('Terminology', pack.terminology),
    '',
    formatBulletSection('Assessment style', pack.assessmentStyle),
    '',
    formatBulletSection('Lesson expectations', pack.lessonExpectations),
  ];

  const subjectNotes = findSubjectNotes(pack, subject);
  if (subjectNotes?.length) {
    lines.push('', formatBulletSection(`Subject notes (${subject.trim()})`, subjectNotes));
  }

  return lines.join('\n');
}
