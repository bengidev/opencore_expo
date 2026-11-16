import type { ChatMessage } from '../chat-message';
import type { ConversationSummary, StoredConversation } from './chat-history';

// The web build keeps today's in-memory behaviour: a static export cannot serve
// the COOP/COEP headers that SQLite's SharedArrayBuffer needs. Same four
// exports, so the hook compiles unchanged for both platforms.

export async function listConversations(): Promise<ConversationSummary[]> {
  return [];
}

export async function loadConversation(_id: string): Promise<StoredConversation | null> {
  return null;
}

export async function saveConversation(
  _summary: ConversationSummary,
  _messages: ChatMessage[],
): Promise<void> {}

export async function deleteConversation(_id: string): Promise<void> {}
