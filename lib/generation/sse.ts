import type { GenerateStreamEvent } from '@/types';

export function encodeSSE(event: GenerateStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export function parseSseDataLine(line: string): GenerateStreamEvent | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('data: ')) return null;
  try {
    return JSON.parse(trimmed.slice(6)) as GenerateStreamEvent;
  } catch {
    return null;
  }
}

/** Split an SSE buffer into parsed events. Incomplete trailing lines stay in `rest` unless flushed. */
export function drainSseEvents(
  buffer: string,
  flush = false,
): { events: GenerateStreamEvent[]; rest: string } {
  const lines = buffer.split('\n');
  const rest = flush ? '' : (lines.pop() ?? '');
  const events: GenerateStreamEvent[] = [];
  for (const line of lines) {
    const event = parseSseDataLine(line);
    if (event) events.push(event);
  }
  return { events, rest };
}
