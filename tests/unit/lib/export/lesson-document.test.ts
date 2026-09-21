import {
  formatICanStatements,
  prepareCellText,
  sanitiseCellContent,
  stripHtmlTags,
} from '@/lib/export/lesson-document';

describe('lesson-document', () => {
  it('strips HTML tags', () => {
    expect(stripHtmlTags('<p>Hello</p>')).toBe('Hello');
  });

  it('removes markdown artifacts from cell content', () => {
    expect(sanitiseCellContent('**Bold** and *italic*')).toBe('Bold and italic');
    expect(sanitiseCellContent('# Heading\n- bullet item')).toBe('Heading\nbullet item');
  });

  it('prepares cell text by stripping HTML then markdown', () => {
    expect(prepareCellText('<strong>**Hook**</strong>')).toBe('Hook');
  });

  it('formats success criteria as I can statements', () => {
    expect(formatICanStatements(['Students can name all five elements'])).toBe(
      'I can name all five elements',
    );
  });
});
