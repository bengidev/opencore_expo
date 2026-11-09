import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { createChatRunner } from './chat-runner.ts';
import { readKeyStatus } from './llm/credentials-runtime.ts';
import type {
  ChatProvider,
  ChatStreamEvent,
  ChatTurn,
  ThinkingLevel,
} from './llm/types.ts';
import { createStreamingFlag } from './streaming-flag.ts';

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
  // The flag owns the 160 ms flip and the run token: a superseded run cannot
  // cancel its successor's timer or turn the flag off under it.
  const flag = useMemo(() => createStreamingFlag(setIsStreaming), []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      flag.dispose();
      runner.abort();
    };
  }, [flag, runner]);

  const start = useCallback(
    async (
      messageId: string,
      turns: ChatTurn[],
      onEvent: (id: string, event: ChatStreamEvent) => void,
    ) => {
      const token = flag.begin();
      try {
        await runner.run({ modelId, messages: turns, thinking }, (event) => {
          // A stream that outlives the screen must not write into its state.
          if (!mountedRef.current) return;
          onEvent(messageId, event);
        });
      } finally {
        flag.end(token);
      }
    },
    [flag, modelId, runner, thinking],
  );

  const abort = useCallback(() => {
    runner.abort();
    flag.cancel();
  }, [flag, runner]);

  return { start, abort, isStreaming };
}
