import { createChatMessage, type ChatMessage, type ChatMessageError } from './chat-message.ts';
import type { ChatStreamEvent } from './llm/types.ts';

const GREETING = "Hi. I'm OpenCore. Send a message to start talking.";

export function createInitialChatMessages(): ChatMessage[] {
  return [createChatMessage('assistant', GREETING, { localOnly: true })];
}

export function appendUserMessage(messages: ChatMessage[], text: string): ChatMessage[] {
  const trimmed = text.trim();
  if (!trimmed) return messages;
  return [...messages, createChatMessage('user', trimmed)];
}

type AssistantReplyPatch = Partial<
  Pick<ChatMessage, 'streaming' | 'reasoningStreaming' | 'reasoningDuration' | 'error'>
>;

function updateAssistantReply(
  messages: ChatMessage[],
  id: string,
  patch: AssistantReplyPatch,
): ChatMessage[] {
  let changed = false;
  const keys = Object.keys(patch) as (keyof AssistantReplyPatch)[];

  const next = messages.map((message) => {
    if (message.id !== id) return message;
    const differs = keys.some((key) => message[key] !== patch[key]);
    if (!differs) return message;
    changed = true;
    return { ...message, ...patch };
  });

  return changed ? next : messages;
}

/** The provider stream is about to feed this reply. */
export function beginAssistantReply(messages: ChatMessage[], id: string): ChatMessage[] {
  return updateAssistantReply(messages, id, { streaming: true });
}

/**
 * Append one delta to the reply. Deltas are the only writers of `text` and
 * `reasoning`, so a later `updateAssistantReply` can never race them. Only an
 * empty chunk is a no-op — a lone space is real content between words.
 */
export function appendReplyDelta(
  messages: ChatMessage[],
  id: string,
  field: 'text' | 'reasoning',
  chunk: string,
): ChatMessage[] {
  if (chunk === '') return messages;

  let changed = false;

  const next = messages.map((message) => {
    if (message.id !== id) return message;
    changed = true;
    return field === 'reasoning'
      ? { ...message, reasoning: message.reasoning + chunk, reasoningStreaming: true }
      : { ...message, text: message.text + chunk };
  });

  return changed ? next : messages;
}

/**
 * The reply stopped early. Whatever arrived so far stays; the error explains
 * why it is not continuing.
 */
export function failAssistantReply(
  messages: ChatMessage[],
  id: string,
  error: ChatMessageError,
): ChatMessage[] {
  return updateAssistantReply(messages, id, {
    streaming: false,
    reasoningStreaming: false,
    error,
  });
}

/** The trace stopped arriving; the answer takes the stage. */
export function startAssistantAnswer(
  messages: ChatMessage[],
  id: string,
  reasoningDuration: number,
): ChatMessage[] {
  return beginAssistantReply(
    updateAssistantReply(messages, id, { reasoningStreaming: false, reasoningDuration }),
    id,
  );
}

export function finishAssistantReply(messages: ChatMessage[], id: string): ChatMessage[] {
  return updateAssistantReply(messages, id, { streaming: false });
}

/**
 * Show the whole reply at once — used when a new message interrupts the active
 * one.
 */
export function settleAssistantReply(
  messages: ChatMessage[],
  id: string,
  reasoningDuration?: number,
): ChatMessage[] {
  let changed = false;

  const next = messages.map((message) => {
    if (message.id !== id) return message;
    const nextDuration = message.reasoningDuration ?? reasoningDuration;
    if (
      !message.streaming &&
      !message.reasoningStreaming &&
      message.reasoningDuration === nextDuration
    ) {
      return message;
    }
    changed = true;
    return {
      ...message,
      streaming: false,
      reasoningStreaming: false,
      reasoningDuration: nextDuration,
    };
  });

  return changed ? next : messages;
}

/**
 * The pure event→state mapping for a live reply. `elapsedSeconds` is the time
 * the trace has run so far, measured by the screen, and only matters on the
 * first answer delta — the transition out of the trace.
 */
export function applyStreamEvent(
  messages: ChatMessage[],
  id: string,
  event: ChatStreamEvent,
  elapsedSeconds?: number,
): ChatMessage[] {
  switch (event.type) {
    case 'reasoning-delta':
      return appendReplyDelta(messages, id, 'reasoning', event.text);

    case 'text-delta': {
      // Only an empty chunk is a no-op; a lone space is real content.
      if (event.text === '') return messages;
      const target = messages.find((message) => message.id === id);
      const staged = target?.reasoningStreaming
        ? startAssistantAnswer(messages, id, elapsedSeconds ?? 1)
        : messages;
      return appendReplyDelta(staged, id, 'text', event.text);
    }

    case 'done': {
      // A reasoning-only reply finishes without ever sending text. Leaving the
      // trace streaming would shimmer forever and keep the answer hidden, so
      // the answer transition happens here too.
      const target = messages.find((message) => message.id === id);
      const staged = target?.reasoningStreaming
        ? startAssistantAnswer(messages, id, elapsedSeconds ?? 1)
        : messages;
      return finishAssistantReply(staged, id);
    }

    case 'error':
      return failAssistantReply(messages, id, {
        code: event.code,
        message: event.message,
        retryable: event.retryable,
      });
  }
}

export function readChatSeed(seed: string | string[] | undefined): string | null {
  const value = Array.isArray(seed) ? seed[0] : seed;
  const trimmed = value?.trim();
  return trimmed || null;
}
