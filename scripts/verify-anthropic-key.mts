import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-4-6';

function formatError(err: unknown): string {
  if (err instanceof Anthropic.APIError) {
    const parts = [`HTTP ${err.status}`, err.message];
    if (err.error?.type) parts.push(`type=${err.error.type}`);
    return parts.join(' — ');
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('FAIL: ANTHROPIC_API_KEY is not set.');
    console.error('Add it to .env.local, then run: npm run test:anthropic-key');
    process.exit(1);
  }

  console.log(`Testing Anthropic API key against ${MODEL}...`);

  const anthropic = new Anthropic({ apiKey });

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 32,
      messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
    });

    const textBlock = message.content.find((block) => block.type === 'text');
    const reply = textBlock?.type === 'text' ? textBlock.text.trim() : '(no text block)';

    console.log('SUCCESS: API key is active.');
    console.log(`  Model: ${message.model}`);
    console.log(`  Response: ${reply}`);
    console.log(`  Usage: ${message.usage.input_tokens} input / ${message.usage.output_tokens} output tokens`);
  } catch (err) {
    console.error('FAIL: Anthropic API call did not succeed.');
    console.error(`  ${formatError(err)}`);

    const message = err instanceof Anthropic.APIError ? err.message.toLowerCase() : '';
    if (message.includes('credit') || message.includes('billing') || message.includes('balance')) {
      console.error('');
      console.error('  Likely cause: no API credits on this workspace.');
      console.error('  Add credits at https://console.anthropic.com/settings/billing');
    }

    process.exit(1);
  }
}

main();
