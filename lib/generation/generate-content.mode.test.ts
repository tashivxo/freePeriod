import {
  generateLessonContent,
  QUALITY_CLAUDE_MODEL,
  QUALITY_MAX_TOKENS,
  QUALITY_OUTPUT_CONFIG,
  QUALITY_THINKING,
  shouldGenerateWithGemini,
} from './generate-content';

const mockMessagesCreate = jest.fn();
const mockMessagesStream = jest.fn();
const mockFinalMessage = jest.fn();

jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(function AnthropicMock(config?: { apiKey?: string }) {
    const apiKey = config?.apiKey?.trim() ?? process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('Anthropic SDK should not be constructed without an API key');
    }
    return {
      messages: {
        stream: mockMessagesStream,
        create: mockMessagesCreate,
      },
    };
  }),
}));

const minimalLessonJson = JSON.stringify({
  title: 'Fractions on a Number Line',
  objectives: ['Represent fractions on a number line'],
});

describe('shouldGenerateWithGemini', () => {
  it('fast uses gemini, quality does not', () => {
    expect(shouldGenerateWithGemini('fast')).toBe(true);
    expect(shouldGenerateWithGemini('quality')).toBe(false);
  });
});

describe('Quality mode Claude caps', () => {
  it('exports capped request constants', () => {
    expect(QUALITY_CLAUDE_MODEL).toBe('claude-sonnet-4-6');
    expect(QUALITY_MAX_TOKENS).toBe(8192);
    expect(QUALITY_THINKING).toEqual({ type: 'adaptive' });
    expect(QUALITY_OUTPUT_CONFIG).toEqual({ effort: 'medium' });
  });
});

describe('generateLessonContent', () => {
  beforeEach(() => {
    mockMessagesCreate.mockReset();
    mockMessagesStream.mockReset();
    mockFinalMessage.mockReset();

    mockFinalMessage.mockResolvedValue({
      content: [{ type: 'text', text: minimalLessonJson }],
      stop_reason: 'end_turn',
      usage: { input_tokens: 120, output_tokens: 340 },
    });
    mockMessagesStream.mockReturnValue({
      finalMessage: mockFinalMessage,
    });
  });

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
      expect(mockMessagesStream).not.toHaveBeenCalled();
      expect(mockMessagesCreate).not.toHaveBeenCalled();
    } finally {
      if (original === undefined) {
        delete process.env.ANTHROPIC_API_KEY;
      } else {
        process.env.ANTHROPIC_API_KEY = original;
      }
    }
  });

  it('streams quality lesson with capped Claude params and no messages.create retry', async () => {
    const original = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    try {
      const result = await generateLessonContent({
        generationMode: 'quality',
        subject: 'Mathematics',
        grade: '5',
        curriculum: 'Common Core',
        duration: 60,
        teacherPrompt: '',
      });

      expect(mockMessagesStream).toHaveBeenCalledTimes(1);
      expect(mockMessagesStream).toHaveBeenCalledWith(
        expect.objectContaining({
          model: QUALITY_CLAUDE_MODEL,
          max_tokens: QUALITY_MAX_TOKENS,
          thinking: QUALITY_THINKING,
          output_config: QUALITY_OUTPUT_CONFIG,
        }),
      );
      expect(mockMessagesCreate).not.toHaveBeenCalled();
      expect(result.modelUsed).toBe(QUALITY_CLAUDE_MODEL);
      expect(result.lessonContent.title).toBe('Fractions on a Number Line');
      expect(result.inputTokens).toBe(120);
      expect(result.outputTokens).toBe(340);
    } finally {
      if (original === undefined) {
        delete process.env.ANTHROPIC_API_KEY;
      } else {
        process.env.ANTHROPIC_API_KEY = original;
      }
    }
  });
});
