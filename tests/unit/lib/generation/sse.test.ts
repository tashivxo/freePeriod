import { drainSseEvents, encodeSSE, parseSseDataLine } from '@/lib/generation/sse';

describe('drainSseEvents', () => {
  it('keeps an incomplete trailing line in rest until flushed', () => {
    const complete = encodeSSE({ type: 'status', message: 'Starting generation…' });
    const partial = 'data: {"type":"complete","lessonId":"lesson-1"';
    const drained = drainSseEvents(complete + partial);

    expect(drained.events).toEqual([{ type: 'status', message: 'Starting generation…' }]);
    expect(drained.rest).toBe(partial);
  });

  it('parses a leftover complete event when the stream ends without a newline', () => {
    const leftover = 'data: {"type":"complete","lessonId":"lesson-1","usage":{"inputTokens":1,"outputTokens":2}}';
    const flushed = drainSseEvents(leftover, true);

    expect(flushed.events).toEqual([
      { type: 'complete', lessonId: 'lesson-1', usage: { inputTokens: 1, outputTokens: 2 } },
    ]);
    expect(flushed.rest).toBe('');
  });

  it('skips malformed data lines', () => {
    expect(parseSseDataLine('data: {not-json')).toBeNull();
    expect(drainSseEvents('data: {not-json}\n', true).events).toEqual([]);
  });
});
