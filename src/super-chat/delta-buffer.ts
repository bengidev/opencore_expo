const DEFAULT_FLUSH_MS = 50;

export type DeltaField = 'text' | 'reasoning';
export type DeltaValue = { text: string; reasoning: string };
export type DeltaFlush = (value: DeltaValue) => void;

export type DeltaBuffer = {
  push(field: DeltaField, chunk: string): void;
  flush(): void;
  dispose(): void;
};

/**
 * Node timers hold the test process open until they fire; a pending UI flush
 * should never do that. React Native's numeric timer has no `unref`.
 */
function unrefTimer(handle: unknown): void {
  if (
    typeof handle === 'object' &&
    handle !== null &&
    'unref' in handle &&
    typeof (handle as { unref?: unknown }).unref === 'function'
  ) {
    (handle as { unref(): void }).unref();
  }
}

/**
 * Coalesce token-sized deltas into one update per window. Each `push` appends
 * to its field and arms a single trailing timer; `flush` delivers both fields
 * at once and re-arms nothing.
 */
export function createDeltaBuffer(flush: DeltaFlush, flushMs = DEFAULT_FLUSH_MS): DeltaBuffer {
  let text = '';
  let reasoning = '';
  let timer: ReturnType<typeof setTimeout> | null = null;

  function clearTimer(): void {
    if (timer === null) return;
    clearTimeout(timer);
    timer = null;
  }

  function emit(): void {
    clearTimer();
    if (text === '' && reasoning === '') return;
    const value = { text, reasoning };
    text = '';
    reasoning = '';
    flush(value);
  }

  function arm(): void {
    if (timer !== null) return;
    const handle = setTimeout(emit, flushMs);
    timer = handle;
    unrefTimer(handle);
  }

  return {
    push(field, chunk) {
      if (chunk === '') return;
      if (field === 'reasoning') reasoning += chunk;
      else text += chunk;
      arm();
    },
    flush: emit,
    dispose: clearTimer,
  };
}
