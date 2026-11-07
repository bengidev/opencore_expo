import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { createChatRunner } from './chat-runner.ts';
import { readKeyStatus } from './llm/credentials-runtime.ts';
import type {
  ChatProvider,
  ChatStreamEvent,
  ChatTurn,
  ThinkingLevel,
} from './llm/types.ts';

/**
 * A request that fails instantly — a missing key, a rejected payload — should
 * not flash a stop control. The running state only appears once the run has
 * outlived a couple of frames.
 */
const STREAMING_FLIP_MS = 160;

export type UseChatRequestOptions = {
  provider: ChatProvider;
  modelId: string;
  thinking: ThinkingLevel | null;
};

export type ChatRequestController = {
  /** Streams one request, delivering every event tagged with `messageId`. */
  start(
    messageId: string,
    turns: ChatTurn[],
    onEvent: (messageId: string, event: ChatStreamEvent) => void,
  ): Promise<void>;
  abort(): void;
  isStreaming: boolean;
};

/**
 * The React face of `createChatRunner`: one runner per provider, the key read
 * at send time so a Settings change applies immediately, and an `isStreaming`
 * flag for the composer's send control.
 */
export function useChatRequest({
  provider,
  modelId,
  thinking,
}: UseChatRequestOptions): ChatRequestController {
  const runner = useMemo(
    () =>
      createChatRunner({
        provider,
        getKey: async () => (await readKeyStatus()).key,
      }),
    [provider],
  );

  const [isStreaming, setIsStreaming] = useState(false);
  const mountedRef = useRef(true);
  const flipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFlipTimer = useCallback(() => {
    if (flipTimerRef.current === null) return;
    clearTimeout(flipTimerRef.current);
    flipTimerRef.current = null;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearFlipTimer();
      runner.abort();
    };
  }, [clearFlipTimer, runner]);

  const start = useCallback(
    async (
      messageId: string,
      turns: ChatTurn[],
      onEvent: (id: string, event: ChatStreamEvent) => void,
    ) => {
      clearFlipTimer();
      flipTimerRef.current = setTimeout(() => {
        flipTimerRef.current = null;
        if (mountedRef.current) setIsStreaming(true);
      }, STREAMING_FLIP_MS);

      try {
        await runner.run({ modelId, messages: turns, thinking }, (event) => {
          onEvent(messageId, event);
        });
      } finally {
        clearFlipTimer();
        if (mountedRef.current) setIsStreaming(false);
      }
    },
    [clearFlipTimer, modelId, runner, thinking],
  );

  const abort = useCallback(() => {
    clearFlipTimer();
    runner.abort();
    if (mountedRef.current) setIsStreaming(false);
  }, [clearFlipTimer, runner]);

  return { start, abort, isStreaming };
}
