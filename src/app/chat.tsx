import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Composer } from '@/components/chat/composer';
import { MessageList } from '@/components/chat/message-list';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth } from '@/constants/theme';
import { createChatMessage, type ChatMessage } from '@/types/chat';

const LOCAL_REPLY =
  'Pesan diterima. Penyedia model belum terhubung, jadi balasan ini masih lokal di perangkat.';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    createChatMessage('assistant', 'Halo. Saya OpenCore. Kirim pesan untuk mulai berbicara.'),
  ]);

  function handleSend(text: string) {
    setMessages((current) => [
      ...current,
      createChatMessage('user', text),
      createChatMessage('assistant', LOCAL_REPLY),
    ]);
  }

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
