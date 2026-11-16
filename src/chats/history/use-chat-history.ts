import { useCallback, useEffect, useRef, useState } from 'react';

import type { ChatMessage } from '../chat-message';
import { createInitialChatMessages } from '../chat-state';
import {
  deriveConversationPreview,
  deriveConversationTitle,
  persistableMessages,
  type ConversationSummary,
} from './chat-history';
import { loadConversation, saveConversation } from './chat-db';

const SAVE_DELAY_MS = 250;

function newConversationId(): string {
  // Same shape as createChatMessage's id: unique per device, sortable by time.
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export type ChatHistory = {
  messages: ChatMessage[];
  commit: (next: ChatMessage[]) => void;
  conversationId: string | null;
  isHydrating: boolean;
  persist: () => void;
};

/**
 * Owns one thread's storage. The screen keeps committing into `commit`, which
 * mirrors the thread synchronously, so `persist()` fired right after a commit
 * always sees that commit.
 *
 * Three triggers funnel through `flush`: immediately after the user turn
 * (`persist`), 250 ms after a change settles, and once on unmount. A write only
 * happens when the persistable messages differ from the last written snapshot,
 * so merely opening a thread never bumps its position in the list.
 */
export function useChatHistory(id: string | undefined): ChatHistory {
  const [messages, setMessages] = useState<ChatMessage[]>(createInitialChatMessages);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isHydrating, setIsHydrating] = useState(Boolean(id));

  const messagesRef = useRef(messages);
  const summaryRef = useRef<ConversationSummary | null>(null);
  const persistedFingerprintRef = useRef<string | null>(null);
  const hydratingRef = useRef(Boolean(id));

  useEffect(() => {
    if (!id) return;
    let alive = true;
    // The screen instance owns one id, so `isHydrating` is already true from the
    // initial state; setting it again here would be a state write inside an effect.
    hydratingRef.current = true;

    void loadConversation(id).then((stored) => {
      if (!alive) return;
      hydratingRef.current = false;
      setIsHydrating(false);
      if (!stored) return; // Deleted elsewhere: keep the greeting, stay unsaved.

      const loaded = stored.messages.length > 0 ? stored.messages : createInitialChatMessages();
      messagesRef.current = loaded;
      // Seeded together with the messages so hydration itself is never dirty.
      persistedFingerprintRef.current = JSON.stringify(persistableMessages(loaded));
      summaryRef.current = stored.summary;
      setConversationId(stored.summary.id);
      setMessages(loaded);
    });

    return () => {
      alive = false;
    };
  }, [id]);

  const flush = useCallback(async () => {
    if (hydratingRef.current) return;
    const persistable = persistableMessages(messagesRef.current);
    // A greeting-only thread is not a conversation yet.
    if (!persistable.some((message) => message.role === 'user')) return;
    const fingerprint = JSON.stringify(persistable);
    if (fingerprint === persistedFingerprintRef.current) return;

    const now = Date.now();
    const summary: ConversationSummary = {
      id: summaryRef.current?.id ?? newConversationId(),
      title: summaryRef.current?.title ?? deriveConversationTitle(persistable),
      preview: deriveConversationPreview(persistable),
      createdAt: summaryRef.current?.createdAt ?? now,
      updatedAt: now,
    };

    summaryRef.current = summary;
    setConversationId(summary.id);

    try {
      await saveConversation(summary, persistable);
      persistedFingerprintRef.current = fingerprint;
    } catch (error) {
      console.warn('[chat history]', error);
    }
  }, []);

  const persist = useCallback(() => {
    void flush();
  }, [flush]);

  const commit = useCallback((next: ChatMessage[]) => {
    messagesRef.current = next;
    setMessages(next);
  }, []);

  // The settle trigger: one timer per change, cleared as soon as anything moves.
  useEffect(() => {
    if (isHydrating) return;
    if (messages.some((message) => message.streaming || message.reasoningStreaming)) return;
    const timer = setTimeout(() => {
      void flush();
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [messages, isHydrating, flush]);

  // A reply in flight when the screen goes away still leaves its question saved.
  useEffect(() => () => {
    void flush();
  }, [flush]);

  return { messages, commit, conversationId, isHydrating, persist };
}
