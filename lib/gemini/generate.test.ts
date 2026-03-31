import { generateWithGemini } from './generate';

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
    jest.clearAllMocks();
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

  it('passes curriculumText to the system instruction', async () => {
    await generateWithGemini({ ...BASE_PARAMS, curriculumText: 'Custom curriculum content' });
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        systemInstruction: expect.stringContaining('Custom curriculum content'),
      }),
    );
  });
});
