import {
  isMeaningfulFill,
  templateDataAppearsInText,
} from '@/lib/export/fill-template-result';

describe('isMeaningfulFill', () => {
  it('rejects zero fills', () => {
    expect(isMeaningfulFill(0, [])).toBe(false);
    expect(isMeaningfulFill(0, ['objectives'])).toBe(false);
  });

  it('rejects fills that only wrote the hardcoded Materials/Resources default', () => {
    expect(isMeaningfulFill(1, ['materials'])).toBe(false);
    expect(isMeaningfulFill(2, ['Resources', 'materials'])).toBe(false);
  });

  it('accepts a fill that wrote at least one real lesson field', () => {
    expect(isMeaningfulFill(1, ['objectives'])).toBe(true);
    expect(isMeaningfulFill(2, ['materials', 'lesson title'])).toBe(true);
  });
});

describe('templateDataAppearsInText', () => {
  it('returns false when no non-trivial values appear', () => {
    expect(
      templateDataAppearsInText('empty template', {
        title: '',
        hook: 'Hi',
      }),
    ).toBe(false);
  });

  it('returns true when a lesson value is present in the document text', () => {
    expect(
      templateDataAppearsInText(
        'Lesson: Exploring States of Matter and particle motion',
        { title: 'Exploring States of Matter' },
      ),
    ).toBe(true);
  });
});
