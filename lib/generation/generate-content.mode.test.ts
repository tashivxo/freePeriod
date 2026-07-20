import { shouldGenerateWithGemini } from './generate-content';

describe('shouldGenerateWithGemini', () => {
  it('fast uses gemini, quality does not', () => {
    expect(shouldGenerateWithGemini('fast')).toBe(true);
    expect(shouldGenerateWithGemini('quality')).toBe(false);
  });
});
