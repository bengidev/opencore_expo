import type { ChatMessage } from './chat-message.ts';
import type { ChatTurn } from './llm/types.ts';

/** How much conversation a single request carries by default. */
const CHAT_HISTORY_LIMIT = 20;

function isRequestTurn(message: ChatMessage): boolean {
  // The greeting and any other conversation-local note never leave the device.
  if (message.localOnly) return false;
  if (message.role !== 'assistant') return true;
  // A blank assistant message is the in-flight placeholder, and an errored
  // reply with no text has nothing to say back to the provider.
  return message.text.trim() !== '';
}

/**
 * The provider-facing history for the next request: conversation-local
 * messages dropped, empty assistant turns dropped, the newest `limit` turns
 * kept, and no leading assistant turn. A leading `system` turn is allowed.
 */
export function toChatTurns(messages: ChatMessage[], limit = CHAT_HISTORY_LIMIT): ChatTurn[] {
  if (limit <= 0) return [];

  const turns: ChatTurn[] = [];

  for (let index = messages.length - 1; index >= 0 && turns.length < limit; index -= 1) {
    const message = messages[index];
    if (!isRequestTurn(message)) continue;
    turns.push({ role: message.role, content: message.text });
  }

  turns.reverse();

  while (turns[0]?.role === 'assistant') {
    turns.shift();
  }

  return turns;
}
