import { mapGenerationError } from './map-error';

const context = { isFreePlan: false, modelUsed: 'claude-sonnet-4-6' };

describe('mapGenerationError', () => {
  it('maps invalid Anthropic API key 401 to a distinct message', () => {
    const err = Object.assign(new Error('401 {"type":"error","error":{"type":"authentication_error","message":"API key is invalid."}}'), {
      status: 401,
      error: { type: 'authentication_error' },
    });

    expect(mapGenerationError(err, context)).toBe(
      'Generation API key is invalid. Update ANTHROPIC_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY in Vercel.',
    );
  });

  it('maps missing Google key to not-configured message', () => {
    expect(mapGenerationError(new Error('GOOGLE_GENERATIVE_AI_API_KEY is not set'), {
      isFreePlan: true,
      modelUsed: 'gemini-2.5-flash',
    })).toBe(
      'Generation API key is not configured on this deployment. Check Vercel environment variables.',
    );
  });
});
