import { createDeltaBuffer, type DeltaBuffer, type DeltaValue } from './delta-buffer.ts';
import type { ChatProvider, ChatRequest, ChatStreamEvent } from './llm/types.ts';

const DEFAULT_FLUSH_MS = 50;
const MISSING_KEY_MESSAGE = 'Add an OpenRouter API key in Settings.';
const UNEXPECTED_MESSAGE = 'The reply stopped unexpectedly.';

export type ChatRunnerOptions = {
  provider: ChatProvider;
  /** Read at request time, so a key saved in Settings applies to the next send. */
  getKey: () => Promise<string | null>;
  /** How long deltas coalesce before one update reaches the screen. */
  flushMs?: number;
};

export type ChatRunner = {
  /** Streams one request. A run in flight is interrupted first. */
  run(request: ChatRequest, onEvent: (event: ChatStreamEvent) => void): Promise<void>;
  /** Stops the run in flight and delivers whatever had already arrived. */
  abort(): void;
  isRunning(): boolean;
};

/**
 * Adapts a provider stream into screen-sized events: one run at a time, deltas
 * coalesced into animation frames, and nothing emitted once a run is aborted.
 *
 * The terminal event is always the provider's own `done` or `error`; an
 * interrupted run ends silently because the screen settles that reply itself.
 */
export function createChatRunner(options: ChatRunnerOptions): ChatRunner {
  const { provider, getKey, flushMs = DEFAULT_FLUSH_MS } = options;

  let controller: AbortController | null = null;
  let buffer: DeltaBuffer | null = null;
  let running = false;

  /** Only the run that owns the current controller may clear it. */
  function release(active: AbortController): void {
    if (controller !== active) return;
    controller = null;
    buffer = null;
    running = false;
  }

  function abort(): void {
    const active = controller;
    if (active === null) return;
    // Deliver what the reader has already watched arrive, then stop. No
    // terminal event follows: an interruption is not the provider's verdict.
    buffer?.flush();
    release(active);
    active.abort();
  }

  async function run(
    request: ChatRequest,
    onEvent: (event: ChatStreamEvent) => void,
  ): Promise<void> {
    abort();

    const active = new AbortController();
    controller = active;
    running = true;

    const deltas = createDeltaBuffer((value: DeltaValue) => {
      if (active.signal.aborted) return;
      if (value.reasoning !== '') onEvent({ type: 'reasoning-delta', text: value.reasoning });
      if (value.text !== '') onEvent({ type: 'text-delta', text: value.text });
    }, flushMs);
    buffer = deltas;

    try {
      let apiKey: string | null;
      try {
        apiKey = await getKey();
      } catch {
        // A keychain that cannot be read is, for this request, a key we do not
        // have: the Settings row is where the user can fix it.
        apiKey = null;
      }

      if (active.signal.aborted) return;

      if (apiKey === null) {
        onEvent({
          type: 'error',
          code: 'missing-key',
          message: MISSING_KEY_MESSAGE,
          retryable: false,
        });
        return;
      }

      for await (const event of provider.streamChat(request, {
        apiKey,
        fetch,
        signal: active.signal,
      })) {
        // The interruption landed while the provider produced this frame; it
        // must not reach the screen.
        if (active.signal.aborted) return;

        if (event.type === 'reasoning-delta') {
          deltas.push('reasoning', event.text);
          continue;
        }
        if (event.type === 'text-delta') {
          deltas.push('text', event.text);
          continue;
        }

        deltas.flush();
        if (active.signal.aborted) return;
        onEvent(event);
        return;
      }

      // A provider that ends without a terminal event still owes the reader
      // the text it already streamed.
      deltas.flush();
    } catch (reason) {
      if (active.signal.aborted) return;
      deltas.flush();
      onEvent({
        type: 'error',
        code: 'unknown',
        message: reason instanceof Error && reason.message !== '' ? reason.message : UNEXPECTED_MESSAGE,
        retryable: true,
      });
    } finally {
      deltas.dispose();
      release(active);
    }
  }

  return {
    run,
    abort,
    isRunning: () => running,
  };
}
