export type ProviderId = 'openrouter';
export type ThinkingLevel = 'low' | 'medium' | 'high' | 'xhigh' | 'max';
export type ModelCapabilityId =
  | 'text' | 'image' | 'documents' | 'code' | 'web' | 'reasoning' | 'audio' | 'video';

export type ChatTurn = { role: 'user' | 'assistant' | 'system'; content: string };
export type ChatRequest = { modelId: string; messages: ChatTurn[]; thinking: ThinkingLevel | null };
export type ChatUsage = { promptTokens: number; completionTokens: number; totalTokens: number };
export type ChatErrorCode =
  | 'missing-key' | 'invalid-key' | 'credits' | 'rate-limit' | 'provider' | 'network' | 'unknown';

export type ChatStreamEvent =
  | { type: 'reasoning-delta'; text: string }
  | { type: 'text-delta'; text: string }
  | { type: 'done'; finishReason: string | null; usage?: ChatUsage }
  | {
      type: 'error';
      code: ChatErrorCode;
      message: string;
      retryable: boolean;
    };

export type ProviderModel = {
  id: string;
  label: string;
  description: string;
  contextLength: number;
  maxOutputTokens?: number;
  capabilities: ModelCapabilityId[];
  thinkingLevels: ThinkingLevel[];
};

export type ProviderContext = { apiKey: string | null; fetch: typeof fetch; signal?: AbortSignal };
export type ModelListContext = { apiKey?: string | null; fetch: typeof fetch };
export type KeyStatus =
  | { state: 'valid'; label: string | null }
  | { state: 'invalid'; message: string }
  | { state: 'unknown'; message: string };

export type ChatProvider = {
  id: ProviderId;
  label: string;
  requiresKey: boolean;
  defaultModelId: string;
  fallbackModels: ProviderModel[];
  streamChat(request: ChatRequest, context: ProviderContext): AsyncIterable<ChatStreamEvent>;
  listModels(context: ModelListContext): Promise<ProviderModel[]>;
  checkKey(apiKey: string, context: ModelListContext): Promise<KeyStatus>;
};
