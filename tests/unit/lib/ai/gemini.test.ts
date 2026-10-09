import { generateWithGemini } from '@/lib/ai/gemini';

// Full mock of @google/generative-ai
const mockGenerateContent = jest.fn();
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  })),
}));

const VALID_LESSON_JSON = JSON.stringify({
  title: 'Test Lesson',
  objectives: ['Objective 1', 'Objective 2'],
  successCriteria: ['Students can demonstrate X'],
  keyConcepts: ['Concept A'],
  hook: 'An engaging opening question',
  mainActivities: ['Activity 1', 'Activity 2'],
  guidedPractice: ['Practice 1'],
  independentPractice: ['Task 1'],
  formativeAssessment: ['Exit ticket'],
  differentiation: {
    support: ['Provide scaffolded worksheets'],
    extension: ['Independent research task'],
  },
  realWorldConnections: ['Connection 1'],
  plenary: 'Consolidation activity',
});

/** Passes planning-field validation so finalizeLessonContent does not call generateContent again. */
const SUBSTANTIVE_LESSON_JSON = JSON.stringify({
  title: 'Test Lesson',
  objectives: ['Objective 1', 'Objective 2'],
  successCriteria: ['Students can demonstrate X'],
  priorKnowledge: [
    'Students should already understand foundational ideas related to this topic from earlier lessons.',
    'Students should be able to follow multi-step instructions and record observations in notebooks.',
  ],
  performanceExpectations: [
    'The lesson develops students ability to explain the topic using supplied curriculum guidance.',
    'Students demonstrate the target learning through evidence-based activities and assessment.',
  ],
  misconceptions: [
    'Students often think particles stop moving in solids — addressed by comparing vibration models.',
    'Students may confuse related vocabulary terms — addressed through explicit definitions.',
  ],
  sciencePractices: [
    'Using evidence from lesson activities to explain the target concept and communicate reasoning.',
    'Comparing information from lesson tasks to identify patterns and support conclusions clearly.',
  ],
  keyConcepts: [
    'Particle motion — particles move faster when thermal energy increases and slower when it decreases.',
    'States of matter — substances exist as solids, liquids, or gases depending on particle arrangement.',
  ],
  vocabulary: [
    'Phase — a distinct form of matter such as solid, liquid, or gas.',
    'Evidence — observations or data used to support scientific explanations in class.',
  ],
  hook: 'An engaging opening question',
  mainActivities: ['Activity 1', 'Activity 2'],
  guidedPractice: ['Practice 1'],
  independentPractice: ['Task 1'],
  formativeAssessment: ['Exit ticket'],
  differentiation: {
    support: ['Provide scaffolded worksheets'],
    extension: ['Independent research task'],
  },
  realWorldConnections: ['Connection 1'],
  plenary: 'Consolidation activity',
});

const BASE_PARAMS = {
  subject: 'Mathematics',
  grade: '5',
  curriculum: 'Common Core',
  duration: 60,
  teacherPrompt: '',
};

describe('generateWithGemini', () => {
  beforeEach(() => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-api-key';
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => VALID_LESSON_JSON,
        usageMetadata: { totalTokenCount: 150 },
      },
    });
  });

  afterEach(() => {
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    mockGenerateContent.mockReset();
  });

  it('returns a parsed lesson section with correct title', async () => {
    const result = await generateWithGemini(BASE_PARAMS);
    expect(result.lessonContent.title).toBe('Test Lesson');
  });

  it('returns correct objectives array', async () => {
    const result = await generateWithGemini(BASE_PARAMS);
    expect(result.lessonContent.objectives).toEqual(['Objective 1', 'Objective 2']);
  });

  it('returns token count from usageMetadata', async () => {
    const result = await generateWithGemini(BASE_PARAMS);
    expect(result.tokenCount).toBe(150);
  });

  it('throws when GOOGLE_GENERATIVE_AI_API_KEY is not set', async () => {
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    await expect(generateWithGemini(BASE_PARAMS)).rejects.toThrow(
      'GOOGLE_GENERATIVE_AI_API_KEY is not set',
    );
  });

  it('throws when Gemini returns invalid JSON', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => 'not valid json at all',
        usageMetadata: { totalTokenCount: 10 },
      },
    });
    await expect(generateWithGemini(BASE_PARAMS)).rejects.toThrow(
      'Failed to parse lesson plan from Gemini response',
    );
  });

  it('throws when Gemini returns JSON missing required fields', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({ foo: 'bar' }),
        usageMetadata: { totalTokenCount: 10 },
      },
    });
    await expect(generateWithGemini(BASE_PARAMS)).rejects.toThrow(
      'Failed to parse lesson plan from Gemini response',
    );
  });

  it('uses 0 as tokenCount when usageMetadata is absent', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => VALID_LESSON_JSON,
        usageMetadata: undefined,
      },
    });
    const result = await generateWithGemini(BASE_PARAMS);
    expect(result.tokenCount).toBe(0);
  });

  it('passes curriculumText in the user contents, not the system instruction', async () => {
    await generateWithGemini({ ...BASE_PARAMS, curriculumText: 'Custom curriculum content' });
    const request = mockGenerateContent.mock.calls[0][0];

    expect(request.systemInstruction).toContain('UPLOADED CURRICULUM DOCUMENT POLICY');
    expect(request.systemInstruction).not.toContain('Custom curriculum content');
    expect(request.contents[0].parts[0].text).toContain('UPLOADED CURRICULUM DOCUMENT (DATA ONLY)');
    expect(request.contents[0].parts[0].text).toContain('Custom curriculum content');
  });

  it('requests application/json from Gemini', async () => {
    await generateWithGemini(BASE_PARAMS);

    expect(mockGenerateContent.mock.calls[0][0].generationConfig).toEqual({
      responseMimeType: 'application/json',
    });
  });

  it('retries a parse failure on attempt 0 and succeeds when attempt 1 returns valid JSON', async () => {
    const unreadable = 'not valid json at all';
    mockGenerateContent
      .mockResolvedValueOnce({
        response: {
          text: () => unreadable,
          candidates: [{ finishReason: 'MAX_TOKENS' }],
          usageMetadata: { totalTokenCount: 10 },
        },
      })
      .mockResolvedValueOnce({
        response: {
          text: () => SUBSTANTIVE_LESSON_JSON,
          usageMetadata: { totalTokenCount: 150 },
        },
      });

    const result = await generateWithGemini(BASE_PARAMS);

    expect(result.lessonContent.title).toBe('Test Lesson');
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  }, 1000);

  it('logs preview, length, and finishReason when Gemini JSON cannot be parsed', async () => {
    const unreadable = 'not valid json at all';
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGenerateContent
      .mockResolvedValueOnce({
        response: {
          text: () => unreadable,
          candidates: [{ finishReason: 'MAX_TOKENS' }],
          usageMetadata: { totalTokenCount: 10 },
        },
      })
      .mockResolvedValueOnce({
        response: {
          text: () => SUBSTANTIVE_LESSON_JSON,
          usageMetadata: { totalTokenCount: 150 },
        },
      });

    try {
      await generateWithGemini(BASE_PARAMS);

      expect(consoleError).toHaveBeenCalledWith(
        '[generateWithGemini] Failed to parse Gemini response',
        expect.objectContaining({
          preview: unreadable,
          length: unreadable.length,
          finishReason: 'MAX_TOKENS',
        }),
      );
    } finally {
      consoleError.mockRestore();
    }
  }, 1000);

  it('throws the parse error after exhausting parse retries', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => 'not valid json at all',
        usageMetadata: { totalTokenCount: 10 },
      },
    });

    await expect(generateWithGemini(BASE_PARAMS)).rejects.toThrow(
      'Failed to parse lesson plan from Gemini response',
    );
    expect(mockGenerateContent).toHaveBeenCalledTimes(3);
  });

  describe('rate-limit retries', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('retries a 429 after backoff and then succeeds', async () => {
      mockGenerateContent
        .mockRejectedValueOnce(new Error('429 Too Many Requests'))
        .mockResolvedValueOnce({
          response: {
            text: () => SUBSTANTIVE_LESSON_JSON,
            usageMetadata: { totalTokenCount: 150 },
          },
        });

      const promise = generateWithGemini(BASE_PARAMS);
      await jest.advanceTimersByTimeAsync(5000);
      const result = await promise;

      expect(result.lessonContent.title).toBe('Test Lesson');
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });

    it('throws the busy message after exhausting 429 retries', async () => {
      mockGenerateContent.mockRejectedValue(new Error('429 Too Many Requests'));

      const promise = generateWithGemini(BASE_PARAMS);
      const rejection = expect(promise).rejects.toThrow(
        'Generation is busy, retrying... (rate limit reached after retries)',
      );
      await jest.advanceTimersByTimeAsync(5000);
      await jest.advanceTimersByTimeAsync(10000);
      await rejection;
      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    });
  });
});
