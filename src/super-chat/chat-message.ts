export type ChatRole = 'user' | 'assistant';

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
};

export type CreateChatMessageOptions = {
  streaming?: boolean;
  reasoning?: string;
  reasoningStreaming?: boolean;
  reasoningDuration?: number;
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
  };
}
