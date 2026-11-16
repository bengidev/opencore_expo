import { readSseData } from '../../sse.ts';
import type {
  ChatRequest,
  ChatStreamEvent,
  KeyStatus,
  ModelListContext,
  ProviderContext,
  ProviderModel,
} from '../../types.ts';
import { toFreeProviderModels } from './catalog.ts';
import {
  buildChatRequest,
  createChatChunkParser,
  errorFromResponse,
} from './protocol.ts';

const API_BASE_URL = 'https://openrouter.ai/api/v1';
const MISSING_KEY_MESSAGE = 'Add an OpenRouter API key in Settings.';
const NETWORK_MESSAGE = "Couldn't reach OpenRouter.";
const PROVIDER_MESSAGE = 'OpenRouter could not answer. Try again.';
const INVALID_KEY_MESSAGE = 'OpenRouter rejected this key.';
export const UNKNOWN_KEY_MESSAGE = "Couldn't verify this key.";

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

async function readErrorBody(response: Response): Promise<unknown> {
  try {
    const text = await response.text();
    if (text.length === 0) return null;
    try {
      const parsed: unknown = JSON.parse(text);
      return parsed;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

async function discardBody(response: Response): Promise<void> {
  try {
    await response.body?.cancel();
  } catch {
    // Best effort: a body that is already consumed or locked cannot be cancelled.
  }
}

async function readKeyLabel(response: Response): Promise<string | null> {
  try {
    const payload: unknown = await response.json();
    const label = asRecord(asRecord(payload)?.data)?.label;
    return typeof label === 'string' ? label : null;
  } catch {
    return null;
  }
}

/**
 * Streams an OpenRouter chat completion as shared chat events.
 *
 * The injected `fetch` is the only network entry point so the caller controls
 * the transport (and the tests can drive it).
 */
export async function* streamOpenRouterChat(
  request: ChatRequest,
  context: ProviderContext,
): AsyncGenerator<ChatStreamEvent> {
  const apiKey = context.apiKey;
  if (!apiKey) {
    yield { type: 'error', code: 'missing-key', message: MISSING_KEY_MESSAGE, retryable: false };
    return;
  }

  let response: Response;
  try {
    response = await context.fetch(`${API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://opencore.app',
        'X-OpenRouter-Title': 'OpenCore',
      },
      body: JSON.stringify(buildChatRequest(request)),
      signal: context.signal,
    });
  } catch {
    if (context.signal?.aborted === true) return;
    yield { type: 'error', code: 'network', message: NETWORK_MESSAGE, retryable: true };
    return;
  }

  if (!response.ok) {
    const body = await readErrorBody(response);
    await discardBody(response);
    yield errorFromResponse(response.status, body);
    return;
  }

  if (response.body === null) {
    yield { type: 'error', code: 'provider', message: PROVIDER_MESSAGE, retryable: true };
    return;
  }

  const parser = createChatChunkParser();
  const events = readSseData(response.body);
  let terminal = false;

  try {
    for (;;) {
      let step: IteratorResult<string>;
      try {
        step = await events.next();
      } catch {
        // Only the reader can fail here; an error thrown in by the consumer at a
        // `yield` propagates instead of being reported as a network event.
        if (context.signal?.aborted === true) return;
        if (terminal) return;
        yield { type: 'error', code: 'network', message: NETWORK_MESSAGE, retryable: true };
        return;
      }

      if (step.done === true) break;

      for (const event of parser.push(step.value)) {
        yield event;
        if (event.type === 'done' || event.type === 'error') terminal = true;
      }
    }
  } finally {
    await events.return(undefined).catch(() => {});
  }

  if (context.signal?.aborted === true) return;
  for (const event of parser.finish()) yield event;
}

/**
 * Lists the free OpenRouter models. Rejects when the catalogue cannot be read
 * - transport failure, non-ok response, a body without free rows - so the
 * caller can tell a failed fetch from a genuinely small live list and show its
 * own fallback row. There is no retry loop here: the caller's retry control
 * owns when to ask again.
 */
export async function listOpenRouterModels(
  context: ModelListContext,
): Promise<ProviderModel[]> {
  const headers =
    context.apiKey != null && context.apiKey.length > 0
      ? { Authorization: `Bearer ${context.apiKey}` }
      : undefined;
  const response = await context.fetch(`${API_BASE_URL}/models`, { headers });
  if (!response.ok) {
    await discardBody(response);
    throw new Error(`OpenRouter catalogue request failed (${response.status}).`);
  }

  const payload: unknown = await response.json();
  const models = toFreeProviderModels(payload);
  if (models.length === 0) throw new Error('OpenRouter returned no free models.');
  return models;
}

/**
 * Validates an OpenRouter key against the key endpoint. Any outcome is reported
 * as a `KeyStatus`; this never rejects.
 */
export async function checkOpenRouterKey(
  apiKey: string,
  context: ModelListContext,
): Promise<KeyStatus> {
  try {
    const response = await context.fetch(`${API_BASE_URL}/key`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (response.status === 200) {
      return { state: 'valid', label: await readKeyLabel(response) };
    }
    await discardBody(response);
    if (response.status === 401 || response.status === 403) {
      return { state: 'invalid', message: INVALID_KEY_MESSAGE };
    }
    return { state: 'unknown', message: UNKNOWN_KEY_MESSAGE };
  } catch {
    return { state: 'unknown', message: UNKNOWN_KEY_MESSAGE };
  }
}
