const DATA_FIELD = 'data:';

/**
 * Reads a `text/event-stream` body and yields one decoded payload per event.
 *
 * Mirrors the browser EventSource rules the chat needs: `data:` values are
 * joined with `\n`, a blank line dispatches the event, `:` comment lines and
 * non-`data:` fields (`event:`, `id:`, `retry:`) are ignored, and a trailing
 * event without a final blank line is flushed when the stream closes.
 */
export async function* readSseData(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  let data: string[] = [];

  const flush = (): string | null => {
    if (data.length === 0) return null;
    const payload = data.join('\n');
    data = [];
    return payload;
  };

  const consumeLine = (line: string): string | null => {
    if (line === '') return flush();
    if (line.startsWith(':')) return null;
    if (!line.startsWith(DATA_FIELD)) return null;
    const value = line.slice(DATA_FIELD.length);
    data.push(value.startsWith(' ') ? value.slice(1) : value);
    return null;
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      pending += decoder.decode(value, { stream: true });

      let newline = pending.indexOf('\n');
      while (newline !== -1) {
        const rawLine = pending.slice(0, newline);
        pending = pending.slice(newline + 1);
        const payload = consumeLine(rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine);
        if (payload !== null) yield payload;
        newline = pending.indexOf('\n');
      }
    }

    pending += decoder.decode();
    if (pending.length > 0) {
      const payload = consumeLine(pending.endsWith('\r') ? pending.slice(0, -1) : pending);
      pending = '';
      if (payload !== null) yield payload;
    }

    const payload = flush();
    if (payload !== null) yield payload;
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
