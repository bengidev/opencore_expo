import type { ChatErrorCode } from './llm/types.ts';

export type ChatRole = 'user' | 'assistant';

export type ChatMessageError = {
  code: ChatErrorCode;
  message: string;
  retryable: boolean;
};

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  streaming: boolean;
  /** The model's working, shown above the answer while it is still arriving. */
  reasoning: string;
  reasoningStreaming: boolean;
  /** Whole seconds the reasoning trace took, once it has finished. */
  reasoningDuration?: number;
  /** Why the reply stopped early; set when the reply fails. */
  error?: ChatMessageError;
  /** Lives only in this conversation — never sent to the provider. */
  localOnly?: true;
};

export type CreateChatMessageOptions = {
  streaming?: boolean;
  reasoning?: string;
  reasoningStreaming?: boolean;
  reasoningDuration?: number;
  error?: ChatMessageError;
  localOnly?: true;
};

export function createChatMessage(
  role: ChatRole,
  text: string,
  options: CreateChatMessageOptions = {},
): ChatMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    streaming: options.streaming ?? false,
    reasoning: options.reasoning ?? '',
    reasoningStreaming: options.reasoningStreaming ?? false,
    reasoningDuration: options.reasoningDuration,
    ...(options.error ? { error: options.error } : {}),
    ...(options.localOnly ? { localOnly: options.localOnly } : {}),
  };
}
