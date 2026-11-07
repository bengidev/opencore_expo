import type {
  ChatErrorCode,
  ChatRequest,
  ChatStreamEvent,
  ChatUsage,
} from '../../types.ts';

type ChatErrorEvent = Extract<ChatStreamEvent, { type: 'error' }>;

const NETWORK_EOF_MESSAGE = 'The connection to OpenRouter ended before the reply finished.';
const INVALID_KEY_MESSAGE = 'OpenRouter rejected this key.';
const CREDITS_MESSAGE = 'This OpenRouter account has no credits.';
const RATE_LIMIT_MESSAGE = 'OpenRouter is rate-limiting free models. Try again shortly.';
const PROVIDER_MESSAGE = 'OpenRouter could not answer. Try again.';
const UNKNOWN_MESSAGE = 'OpenRouter rejected the request.';

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function readUsage(value: unknown): ChatUsage | null {
  const raw = asRecord(value);
  if (raw === null) return null;
  const promptTokens = asNumber(raw.prompt_tokens);
  const completionTokens = asNumber(raw.completion_tokens);
  const totalTokens = asNumber(raw.total_tokens);
  if (promptTokens === null || completionTokens === null || totalTokens === null) return null;
  return { promptTokens, completionTokens, totalTokens };
}

function readReasoningText(delta: Record<string, unknown>): string | null {
  const parts: string[] = [];
  const direct = asString(delta.reasoning);
  if (direct !== null) parts.push(direct);

  for (const entry of asArray(delta.reasoning_details)) {
    const detail = asRecord(entry);
    if (detail === null || detail.type !== 'reasoning.text') continue;
    const text = asString(detail.text);
    if (text !== null) parts.push(text);
  }

  const text = parts.join('');
  return text.length > 0 ? text : null;
}

function providerDetail(body: unknown): {
  message: string | null;
  type: string | null;
  code: unknown;
} {
  const error = asRecord(asRecord(body)?.error);
  return {
    message: asString(error?.message),
    type: asString(error?.type),
    code: error?.code ?? null,
  };
}

function numericStatus(code: unknown): number {
  if (typeof code === 'number' && Number.isFinite(code)) return code;
  if (typeof code === 'string' && /^\d+$/.test(code.trim())) return Number(code.trim());
  return 0;
}

export function buildChatRequest(request: ChatRequest): Record<string, unknown> {
  const messages = request.messages.map(({ role, content }) => ({ role, content }));
  const body: Record<string, unknown> = {
    model: request.modelId,
    messages,
    stream: true,
  };
  if (request.thinking !== null) {
    body.reasoning = { effort: request.thinking };
  }
  return body;
}

export function createChatChunkParser(): {
  push(payload: string): ChatStreamEvent[];
  finish(): ChatStreamEvent[];
} {
  let terminal = false;
  let lastFinishReason: string | null = null;
  let lastUsage: ChatUsage | null = null;

  const doneEvent = (): ChatStreamEvent => {
    terminal = true;
    return lastUsage === null
      ? { type: 'done', finishReason: lastFinishReason }
      : { type: 'done', finishReason: lastFinishReason, usage: lastUsage };
  };

  const push = (payload: string): ChatStreamEvent[] => {
    if (terminal) return [];
    if (payload === '[DONE]') return [doneEvent()];

    let parsed: unknown;
    try {
      parsed = JSON.parse(payload);
    } catch {
      return [];
    }

    const chunk = asRecord(parsed);
    if (chunk === null) return [];

    if (chunk.error !== undefined && chunk.error !== null) {
      terminal = true;
      const status = numericStatus(providerDetail(chunk).code);
      return [errorFromResponse(status, chunk)];
    }

    const events: ChatStreamEvent[] = [];
    const choice = asRecord(asArray(chunk.choices)[0]);
    let finishReason: string | null = null;

    if (choice !== null) {
      const delta = asRecord(choice.delta);
      if (delta !== null) {
        const reasoning = readReasoningText(delta);
        if (reasoning !== null) events.push({ type: 'reasoning-delta', text: reasoning });

        const content = asString(delta.content);
        if (content !== null && content.length > 0) {
          events.push({ type: 'text-delta', text: content });
        }
      }

      finishReason = asString(choice.finish_reason);
      if (finishReason !== null) lastFinishReason = finishReason;
    }

    const usage = readUsage(chunk.usage);
    if (usage !== null) lastUsage = usage;

    if (finishReason !== null) events.push(doneEvent());

    return events;
  };

  const finish = (): ChatStreamEvent[] => {
    if (terminal) return [];
    terminal = true;
    return [
      { type: 'error', code: 'network', message: NETWORK_EOF_MESSAGE, retryable: true },
    ];
  };

  return { push, finish };
}

function errorEvent(code: ChatErrorCode, message: string, retryable: boolean): ChatErrorEvent {
  return { type: 'error', code, message, retryable };
}

export function errorFromResponse(status: number, body: unknown): ChatErrorEvent {
  const detail = providerDetail(body);
  const message = (fallback: string): string =>
    detail.message !== null && detail.message.length > 0 ? detail.message : fallback;

  if (!Number.isFinite(status) || status <= 0) {
    const code = typeof detail.code === 'string' || typeof detail.code === 'number'
      ? String(detail.code)
      : '';
    const hint = `${detail.type ?? ''} ${code} ${detail.message ?? ''}`.toLowerCase();

    if (hint.includes('rate') || hint.includes('429')) {
      return errorEvent('rate-limit', message(RATE_LIMIT_MESSAGE), true);
    }
    if (hint.includes('credit') || hint.includes('402') || hint.includes('insufficient')) {
      return errorEvent('credits', message(CREDITS_MESSAGE), false);
    }
    if (hint.includes('auth') || hint.includes('401') || hint.includes('key') || hint.includes('unauthor')) {
      return errorEvent('invalid-key', message(INVALID_KEY_MESSAGE), false);
    }
    return errorEvent('provider', message(PROVIDER_MESSAGE), true);
  }

  if (status === 401) return errorEvent('invalid-key', message(INVALID_KEY_MESSAGE), false);
  if (status === 402) return errorEvent('credits', message(CREDITS_MESSAGE), false);
  if (status === 429) return errorEvent('rate-limit', message(RATE_LIMIT_MESSAGE), true);
  if (status >= 500) return errorEvent('provider', message(PROVIDER_MESSAGE), true);
  return errorEvent('unknown', message(UNKNOWN_MESSAGE), false);
}
