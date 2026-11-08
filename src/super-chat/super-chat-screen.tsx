import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AndroidAppBar } from '@/components/android-app-bar';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useKeyboardBottomPadding } from '@/hooks/use-keyboard-bottom-padding';
import {
  appendUserMessage,
  applyStreamEvent,
  createInitialChatMessages,
  readChatSeed,
  settleAssistantReply,
} from '@/super-chat/chat-state';
import { createChatMessage, type ChatMessage } from '@/super-chat/chat-message';
import { toChatTurns } from '@/super-chat/chat-turns';
import { toHomeModel } from '@/super-chat/composer/chat-models';
import { SuperChatComposer } from '@/super-chat/composer/super-chat-composer';
import type { ChatStreamEvent } from '@/super-chat/llm/types';
import { selectThinkingLevel } from '@/super-chat/llm/model-selection-store';
import { useModelCatalog } from '@/super-chat/llm/use-model-catalog';
import { MessageList } from '@/super-chat/message-list';
import { useChatRequest } from '@/super-chat/use-chat-request';

function elapsedSeconds(startedAt: number | null): number {
  if (startedAt === null) return 1;
  return Math.max(1, Math.round((Date.now() - startedAt) / 1000));
}

/** The reply currently receiving the stream, and when its trace began. */
type ActiveReply = { id: string; startedAt: number };

export function SuperChatScreen() {
  const insets = useSafeAreaInsets();
  const keyboardPadding = useKeyboardBottomPadding(
    Math.max(insets.bottom, Spacing.three),
    Spacing.three,
  );
  const { seed } = useLocalSearchParams<{ seed?: string }>();
  const appliedSeedRef = useRef<string | null>(null);
  const activeReplyRef = useRef<ActiveReply | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(createInitialChatMessages);
  // The send and retry paths need the thread synchronously, before React has
  // committed the last delta; the state mirror alone is one render behind.
  const messagesRef = useRef(messages);
  const [draft, setDraft] = useState('');
  const {
    provider,
    models,
    selectedModel,
    selection,
    thinking,
    selectModel,
    status,
    error,
    reload,
  } = useModelCatalog();
  const homeModels = useMemo(() => models.map(toHomeModel), [models]);
  const { start, abort, isStreaming } = useChatRequest({
    provider,
    modelId: selectedModel.id,
    thinking,
  });

  const commit = useCallback((next: ChatMessage[]) => {
    messagesRef.current = next;
    setMessages(next);
  }, []);

  const handleModelSelect = useCallback(
    (id: string) => {
      const model = models.find((entry) => entry.id === id);
      if (model) selectModel(model);
    },
    [models, selectModel],
  );

  const applyEvent = useCallback(
    (id: string, event: ChatStreamEvent, startedAt: number) => {
      if (
        (event.type === 'done' || event.type === 'error') &&
        activeReplyRef.current?.id === id
      ) {
        activeReplyRef.current = null;
      }
      commit(applyStreamEvent(messagesRef.current, id, event, elapsedSeconds(startedAt)));
    },
    [commit],
  );

  /** Appends the blank assistant message the stream will fill. */
  const startReply = useCallback(
    (history: ChatMessage[]) => {
      const reply = createChatMessage('assistant', '', { streaming: true });
      const startedAt = Date.now();
      commit([...history, reply]);
      activeReplyRef.current = { id: reply.id, startedAt };
      void start(reply.id, toChatTurns(history), (id, event) => {
        applyEvent(id, event, startedAt);
      });
    },
    [applyEvent, commit, start],
  );

  const sendMessage = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;

      setDraft('');
      abort();

      const interrupted = activeReplyRef.current;
      activeReplyRef.current = null;
      const settled = interrupted
        ? settleAssistantReply(
            messagesRef.current,
            interrupted.id,
            elapsedSeconds(interrupted.startedAt),
          )
        : messagesRef.current;

      const withUser = appendUserMessage(settled, trimmed);
      if (withUser === settled) return;
      startReply(withUser);
    },
    [abort, startReply],
  );

  const handleNewChat = useCallback(() => {
    abort();
    activeReplyRef.current = null;
    commit(createInitialChatMessages());
    setDraft('');
  }, [abort, commit]);

  /**
   * Retry the newest reply only: earlier answers have turns after them, so
   * re-running one would ask the provider to invent over settled history.
   */
  const retryMessage = useCallback(
    (id: string) => {
      const current = messagesRef.current;
      const index = current.findIndex((message) => message.id === id);
      if (index === -1 || index !== current.length - 1) return;

      abort();
      activeReplyRef.current = null;
      startReply(current.slice(0, index));
    },
    [abort, startReply],
  );

  useEffect(() => {
    const trimmed = readChatSeed(seed);
    if (trimmed === null || appliedSeedRef.current === trimmed) return;
    appliedSeedRef.current = trimmed;
    sendMessage(trimmed);
  }, [seed, sendMessage]);

  return (
    <ThemedView style={styles.screen}>
      <AndroidAppBar title="OpenCore" />
      <Animated.View style={[styles.column, keyboardPadding]}>
        <MessageList messages={messages} onRetry={retryMessage} />
        <View style={styles.composer}>
          <SuperChatComposer
            draft={draft}
            onDraftChange={setDraft}
            onSubmit={sendMessage}
            onNewChat={handleNewChat}
            models={homeModels}
            modelId={selectedModel.id}
            thinkingByModel={selection.thinkingByModel}
            onModelSelect={handleModelSelect}
            onThinkingChange={selectThinkingLevel}
            status={status}
            error={error}
            reload={reload}
            isStreaming={isStreaming}
          />
        </View>
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  composer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
});
