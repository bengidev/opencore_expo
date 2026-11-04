import { createChatMessage, type ChatMessage } from './chat-message.ts';

const GREETING = "Hi. I'm OpenCore. Send a message to start talking.";

export function createInitialChatMessages(): ChatMessage[] {
  return [createChatMessage('assistant', GREETING)];
}

export function appendUserMessage(messages: ChatMessage[], text: string): ChatMessage[] {
  const trimmed = text.trim();
  if (!trimmed) return messages;
  return [...messages, createChatMessage('user', trimmed)];
}

type AssistantReplyPatch = Partial<
  Pick<ChatMessage, 'streaming' | 'reasoningStreaming' | 'reasoningDuration'>
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

/** The trace stopped arriving; the answer takes the stage. */
export function startAssistantAnswer(
  messages: ChatMessage[],
  id: string,
  reasoningDuration: number,
): ChatMessage[] {
  return updateAssistantReply(messages, id, {
    reasoningStreaming: false,
    reasoningDuration,
    streaming: true,
  });
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

export function readChatSeed(seed: string | string[] | undefined): string | null {
  const value = Array.isArray(seed) ? seed[0] : seed;
  const trimmed = value?.trim();
  return trimmed || null;
}
