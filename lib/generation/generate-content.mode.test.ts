import { generateLessonContent, shouldGenerateWithGemini } from './generate-content';

jest.mock('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => {
    throw new Error('Anthropic SDK should not be constructed in this test');
  }),
}));

describe('shouldGenerateWithGemini', () => {
  it('fast uses gemini, quality does not', () => {
    expect(shouldGenerateWithGemini('fast')).toBe(true);
    expect(shouldGenerateWithGemini('quality')).toBe(false);
  });
});

describe('generateLessonContent', () => {
  it('throws when ANTHROPIC_API_KEY is not set for quality mode', async () => {
    const original = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    try {
      await expect(
        generateLessonContent({
          generationMode: 'quality',
          subject: 'Mathematics',
          grade: '5',
          curriculum: 'Common Core',
          duration: 60,
          teacherPrompt: '',
        }),
      ).rejects.toThrow('ANTHROPIC_API_KEY is not set');
    } finally {
      if (original === undefined) {
        delete process.env.ANTHROPIC_API_KEY;
      } else {
        process.env.ANTHROPIC_API_KEY = original;
      }
    }
  });
});
