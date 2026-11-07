import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AndroidAppBar } from '@/components/android-app-bar';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useKeyboardBottomPadding } from '@/hooks/use-keyboard-bottom-padding';
import { getMarkdownStreamingDurationMs } from '@/super-chat/chat-markdown';
import {
  appendUserMessage,
  createInitialChatMessages,
  finishAssistantReply,
  readChatSeed,
  settleAssistantReply,
  startAssistantAnswer,
} from '@/super-chat/chat-state';
import { createChatMessage, type ChatMessage } from '@/super-chat/chat-message';
import { toHomeModel } from '@/super-chat/composer/chat-models';
import { SuperChatComposer } from '@/super-chat/composer/super-chat-composer';
import { selectThinkingLevel } from '@/super-chat/llm/model-selection-store';
import { useModelCatalog } from '@/super-chat/llm/use-model-catalog';
import { pickDummyReply } from '@/super-chat/dummy-replies';
import { MessageList } from '@/super-chat/message-list';
import { getReasoningDurationMs } from '@/super-chat/streaming-timing';

function elapsedSeconds(startedAt: number | null): number {
  if (startedAt === null) return 1;
  return Math.max(1, Math.round((Date.now() - startedAt) / 1000));
}

export function SuperChatScreen() {
  const insets = useSafeAreaInsets();
  const keyboardPadding = useKeyboardBottomPadding(
    Math.max(insets.bottom, Spacing.three),
    Spacing.three,
  );
  const { seed } = useLocalSearchParams<{ seed?: string }>();
  const reducedMotion = useReducedMotion() ?? false;
  const appliedSeedRef = useRef<string | null>(null);
  const reasoningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeReplyIdRef = useRef<string | null>(null);
  const activeReplyStartedAtRef = useRef<number | null>(null);
  const replyTurnRef = useRef(0);
  const [messages, setMessages] = useState<ChatMessage[]>(createInitialChatMessages);
  const [draft, setDraft] = useState('');
  const { models, selectedModel, selection, selectModel } = useModelCatalog();
  const homeModels = useMemo(() => models.map(toHomeModel), [models]);

  const handleModelSelect = useCallback(
    (id: string) => {
      const model = models.find((entry) => entry.id === id);
      if (model) selectModel(model);
    },
    [models, selectModel],
  );

  const clearReplyTimers = useCallback(() => {
    if (reasoningTimerRef.current !== null) {
      clearTimeout(reasoningTimerRef.current);
      reasoningTimerRef.current = null;
    }
    if (answerTimerRef.current !== null) {
      clearTimeout(answerTimerRef.current);
      answerTimerRef.current = null;
    }
  }, []);

  const finishReply = useCallback((id: string) => {
    setMessages((current) => finishAssistantReply(current, id));
    if (activeReplyIdRef.current === id) {
      activeReplyIdRef.current = null;
      activeReplyStartedAtRef.current = null;
    }
  }, []);

  const sendMessage = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;

      setDraft('');
      clearReplyTimers();

      const interruptedId = activeReplyIdRef.current;
      const interruptedAt = activeReplyStartedAtRef.current;
      activeReplyIdRef.current = null;
      activeReplyStartedAtRef.current = null;

      setMessages((current) => {
        const settled = interruptedId
          ? settleAssistantReply(current, interruptedId, elapsedSeconds(interruptedAt))
          : current;
        return appendUserMessage(settled, trimmed);
      });

      const reply = pickDummyReply(replyTurnRef.current);
      replyTurnRef.current += 1;

      const reasoningMs = getReasoningDurationMs(reply.reasoning);
      const answerMs = getMarkdownStreamingDurationMs(reply.answer);

      const message = createChatMessage('assistant', reply.answer, {
        streaming: !reducedMotion,
        reasoning: reply.reasoning,
        reasoningStreaming: !reducedMotion,
        reasoningDuration: reducedMotion
          ? Math.max(1, Math.round(reasoningMs / 1000))
          : undefined,
      });
      setMessages((current) => [...current, message]);

      if (reducedMotion) return;

      activeReplyIdRef.current = message.id;
      activeReplyStartedAtRef.current = Date.now();

      reasoningTimerRef.current = setTimeout(() => {
        reasoningTimerRef.current = null;
        const duration = elapsedSeconds(activeReplyStartedAtRef.current);
        setMessages((current) => startAssistantAnswer(current, message.id, duration));

        answerTimerRef.current = setTimeout(() => {
          answerTimerRef.current = null;
          finishReply(message.id);
        }, answerMs);
      }, reasoningMs);
    },
    [clearReplyTimers, finishReply, reducedMotion],
  );

  useEffect(() => {
    const trimmed = readChatSeed(seed);
    if (trimmed === null || appliedSeedRef.current === trimmed) return;
    appliedSeedRef.current = trimmed;
    sendMessage(trimmed);
  }, [seed, sendMessage]);

  useEffect(() => {
    return () => clearReplyTimers();
  }, [clearReplyTimers]);

  function handleNewChat() {
    clearReplyTimers();
    activeReplyIdRef.current = null;
    activeReplyStartedAtRef.current = null;
    replyTurnRef.current = 0;
    setMessages(createInitialChatMessages());
    setDraft('');
  }

  return (
    <ThemedView style={styles.screen}>
      <AndroidAppBar title="OpenCore" />
      <Animated.View style={[styles.column, keyboardPadding]}>
        <MessageList messages={messages} />
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
