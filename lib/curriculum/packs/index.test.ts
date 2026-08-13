import { buildSystemPrompt } from '@/lib/ai/claude';
import {
  formatCurriculumPackForPrompt,
  getCurriculumPack,
} from '@/lib/curriculum/packs';
import { CURRICULA } from '@/lib/utils/curricula';

describe('curriculum packs', () => {
  it('includes ADEK (Abu Dhabi) in the curricula list after UAE MOE', () => {
    const uaeIndex = CURRICULA.indexOf('UAE MOE');
    const adekIndex = CURRICULA.indexOf('ADEK (Abu Dhabi)');

    expect(uaeIndex).toBeGreaterThanOrEqual(0);
    expect(adekIndex).toBe(uaeIndex + 1);
  });

  it('returns packs for UAE MOE and ADEK (Abu Dhabi)', () => {
    const uaePack = getCurriculumPack('UAE MOE');
    const adekPack = getCurriculumPack('ADEK (Abu Dhabi)');

    expect(uaePack).not.toBeNull();
    expect(uaePack?.id).toBe('uae-moe');
    expect(uaePack?.curriculumValues).toContain('UAE MOE');

    expect(adekPack).not.toBeNull();
    expect(adekPack?.id).toBe('adek');
    expect(adekPack?.curriculumValues).toContain('ADEK (Abu Dhabi)');
  });

  it('returns null for unsupported curricula', () => {
    expect(getCurriculumPack('IB')).toBeNull();
    expect(getCurriculumPack('')).toBeNull();
  });

  it('formats pack prompt text with subject notes when available', () => {
    const pack = getCurriculumPack('UAE MOE');
    expect(pack).not.toBeNull();

    const formatted = formatCurriculumPackForPrompt(pack!, 'Mathematics', 'Grade 9');

    expect(formatted).toContain(`Guideline pack: ${pack!.displayName}`);
    expect(formatted).toContain('not an official ministry document');
    expect(formatted).toContain('Do not invent official outcome or standards codes');
    expect(formatted).toContain('Subject notes (Mathematics)');
  });

  it('appends guideline pack section without inventing codes', () => {
    const pack = getCurriculumPack('ADEK (Abu Dhabi)');
    expect(pack).not.toBeNull();

    const guidelinePackText = formatCurriculumPackForPrompt(pack!, 'Science', 'Grade 5');
    const prompt = buildSystemPrompt(undefined, undefined, guidelinePackText);

    expect(prompt).toContain('--- CURRICULUM GUIDELINE PACK ---');
    expect(prompt).toContain('--- END CURRICULUM GUIDELINE PACK ---');
    expect(prompt).toContain('Do not invent official standards codes.');
    expect(prompt).not.toContain('from this pack');
  });

  it('does not inject sourceNotes URLs into the model prompt', () => {
    const pack = getCurriculumPack('UAE MOE');
    expect(pack).not.toBeNull();

    const formatted = formatCurriculumPackForPrompt(pack!, 'Science', 'Grade 5');

    expect(formatted).not.toContain('Source notes');
    expect(formatted).not.toMatch(/https?:\/\//);
    expect(formatted).not.toContain('careers.moe.gov.ae');

    const adek = getCurriculumPack('ADEK (Abu Dhabi)');
    expect(adek).not.toBeNull();
    const adekFormatted = formatCurriculumPackForPrompt(adek!, 'Science', 'Grade 5');
    expect(adekFormatted).not.toContain('Source notes');
    expect(adekFormatted).not.toMatch(/https?:\/\//);
  });

  it('maps science aliases without matching Computer Science to Science notes', () => {
    const pack = getCurriculumPack('UAE MOE');
    expect(pack).not.toBeNull();

    const biology = formatCurriculumPackForPrompt(pack!, 'Biology', 'Grade 9');
    const chemistry = formatCurriculumPackForPrompt(pack!, 'Chemistry', 'Grade 9');
    const physics = formatCurriculumPackForPrompt(pack!, 'Physics', 'Grade 9');
    const computerScience = formatCurriculumPackForPrompt(pack!, 'Computer Science', 'Grade 9');

    expect(biology).toContain('Subject notes (Biology)');
    expect(chemistry).toContain('Subject notes (Chemistry)');
    expect(physics).toContain('Subject notes (Physics)');
    expect(biology).toContain('scientific reasoning');
    expect(computerScience).not.toContain('Subject notes (Computer Science)');
    expect(computerScience).not.toContain('scientific reasoning');
  });
});
