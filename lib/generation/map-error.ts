type GenerationErrorContext = {
  isFreePlan: boolean;
  modelUsed: string;
};

export function mapGenerationError(err: unknown, context: GenerationErrorContext): string {
  const sdkErr = err as {
    status?: number;
    error?: { type?: string; error?: { type?: string; message?: string } };
    message?: string;
    cause?: unknown;
    stack?: string;
  };
  const errType = sdkErr.error?.error?.type ?? sdkErr.error?.type;
  const errMessage = sdkErr.error?.error?.message ?? sdkErr.message ?? '';

  console.error('[generate] Error caught:', JSON.stringify({
    errType,
    status: sdkErr.status,
    message: sdkErr.message,
    cause: String(sdkErr.cause ?? ''),
    stack: (err as Error)?.stack?.split('\n').slice(0, 8),
    isFreePlan: context.isFreePlan,
    modelUsed: context.modelUsed,
  }, null, 2));

  if (err instanceof Error && err.message === 'Failed to parse lesson plan from Claude response') {
    return err.message;
  }

  if (errType === 'overloaded_error') {
    return 'Claude is currently overloaded. Please try again in a moment.';
  }

  if (
    sdkErr.status === 429
    || errMessage.toLowerCase().includes('generation is busy')
    || errMessage.toLowerCase().includes('rate limit reached after retries')
  ) {
    return 'Generation is busy, please try again in a moment.';
  }

  if (
    errMessage.toLowerCase().includes('credit balance')
    || errMessage.toLowerCase().includes('insufficient')
  ) {
    return 'Anthropic API credits are exhausted. Please add credits at console.anthropic.com.';
  }

  if (errType === 'invalid_request_error') {
    return 'Invalid request to Claude API. Please try again.';
  }

  if (errMessage.includes('GOOGLE_GENERATIVE_AI_API_KEY') || errMessage.toLowerCase().includes('api key')) {
    return 'Generation API key is not configured on this deployment. Check Vercel environment variables.';
  }

  return `An unexpected error occurred during generation. [${errType ?? (err as Error)?.name ?? 'Error'}${sdkErr.status ? `:${sdkErr.status}` : ''}]`;
}
