import { NextResponse } from 'next/server';

/**
 * GET /api/health
 *
 * Returns generation configuration and environment variable presence (never values).
 * Useful for diagnosing missing env vars on a Vercel preview deployment.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    generation: {
      freePlanModel: 'gemini-2.0-flash',
      freePlanEnvVar: 'GOOGLE_GENERATIVE_AI_API_KEY',
      proPlanModel: 'claude-sonnet-4-6 (default)',
      proPlanEnvVar: 'ANTHROPIC_API_KEY',
    },
    env: {
      // The key the Gemini code actually reads — must be set in Vercel env vars
      GOOGLE_GENERATIVE_AI_API_KEY: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      // Common alias — NOT read by the code, shown here to detect misconfiguration
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    notes: {
      geminiKeyName:
        'Code reads GOOGLE_GENERATIVE_AI_API_KEY — if only GEMINI_API_KEY is set in Vercel, generation will fail for free-plan users',
    },
  });
}
