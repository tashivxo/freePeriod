import type { GenerateStreamEvent } from '@/types';

export function encodeSSE(event: GenerateStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}
