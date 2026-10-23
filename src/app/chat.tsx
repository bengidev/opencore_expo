import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Composer } from '@/components/chat/composer';
import { MessageList } from '@/components/chat/message-list';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth } from '@/constants/theme';
import type { ChatMessage } from '@/super-chat/chat-message';
import { appendChatExchange, createInitialChatMessages, readChatSeed } from '@/super-chat/chat-state';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { seed } = useLocalSearchParams<{ seed?: string }>();
  const appliedSeedRef = useRef<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(createInitialChatMessages);

  function handleSend(text: string) {
    setMessages((current) => appendChatExchange(current, text));
  }

  useEffect(() => {
    const trimmed = readChatSeed(seed);
    if (trimmed === null || appliedSeedRef.current === trimmed) {
      return;
    }
    appliedSeedRef.current = trimmed;
    setMessages((current) => appendChatExchange(current, trimmed));
  }, [seed]);

  return (
    <ThemedView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.column}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 56 : 0}>
        <MessageList messages={messages} />
        <Composer onSend={handleSend} />
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
});
