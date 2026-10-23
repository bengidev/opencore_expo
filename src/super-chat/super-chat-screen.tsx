import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import type { ChatMessage } from '@/super-chat/chat-message';
import { appendChatExchange, createInitialChatMessages, readChatSeed } from '@/super-chat/chat-state';
import { SuperChatComposer } from '@/super-chat/composer/super-chat-composer';
import { MessageList } from '@/super-chat/message-list';

export function SuperChatScreen() {
  const insets = useSafeAreaInsets();
  const { seed } = useLocalSearchParams<{ seed?: string }>();
  const appliedSeedRef = useRef<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(createInitialChatMessages);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    const trimmed = readChatSeed(seed);
    if (trimmed === null || appliedSeedRef.current === trimmed) return;
    appliedSeedRef.current = trimmed;
    setMessages((current) => appendChatExchange(current, trimmed));
  }, [seed]);

  function handleSubmit(message: string) {
    setDraft('');
    setMessages((current) => appendChatExchange(current, message));
  }

  function handleNewChat() {
    setMessages(createInitialChatMessages());
    setDraft('');
  }

  return (
    <ThemedView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.column}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 56 : 0}>
        <MessageList messages={messages} />
        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, Spacing.three) }]}>
          <SuperChatComposer
            draft={draft}
            onDraftChange={setDraft}
            onSubmit={handleSubmit}
            onNewChat={handleNewChat}
          />
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  composer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
});
