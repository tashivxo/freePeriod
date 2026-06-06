import { buildExportFilename, subjectSlug } from '@/lib/export/filename';

describe('export filename', () => {
  it('slugifies subject text for filenames', () => {
    expect(subjectSlug('Science Chemistry')).toBe('science_chemistry');
    expect(subjectSlug('English Reading')).toBe('english_reading');
    expect(subjectSlug('Mathematics')).toBe('mathematics');
    expect(subjectSlug('')).toBe('generic');
  });

  it('builds freeperiod lesson plan filenames', () => {
    expect(buildExportFilename('Science Chemistry', 'docx')).toBe(
      'freeperiod_lesson_plan_science_chemistry.docx',
    );
    expect(buildExportFilename('English Reading', 'pdf')).toBe(
      'freeperiod_lesson_plan_english_reading.pdf',
    );
    expect(buildExportFilename(undefined, 'docx')).toBe('freeperiod_lesson_plan_generic.docx');
  });
});
