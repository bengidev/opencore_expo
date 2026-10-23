import { createChatMessage, type ChatMessage } from './chat-message';

const GREETING = 'Halo. Saya OpenCore. Kirim pesan untuk mulai berbicara.';
const LOCAL_REPLY =
  'Pesan diterima. Penyedia model belum terhubung, jadi balasan ini masih lokal di perangkat.';

export function createInitialChatMessages(): ChatMessage[] {
  return [createChatMessage('assistant', GREETING)];
}

export function appendChatExchange(messages: ChatMessage[], text: string): ChatMessage[] {
  const trimmed = text.trim();
  if (!trimmed) return messages;
  return [
    ...messages,
    createChatMessage('user', trimmed),
    createChatMessage('assistant', LOCAL_REPLY),
  ];
}

export function readChatSeed(seed: string | string[] | undefined): string | null {
  const value = Array.isArray(seed) ? seed[0] : seed;
  const trimmed = value?.trim();
  return trimmed || null;
}
