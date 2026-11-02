import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KeyboardDismissSurface } from '@/components/keyboard-dismiss-surface';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useKeyboardBottomPadding } from '@/hooks/use-keyboard-bottom-padding';
import type { ChatMessage } from '@/super-chat/chat-message';
import { appendChatExchange, createInitialChatMessages, readChatSeed } from '@/super-chat/chat-state';
import { SuperChatComposer } from '@/super-chat/composer/super-chat-composer';
import { MessageList } from '@/super-chat/message-list';

export function SuperChatScreen() {
  const insets = useSafeAreaInsets();
  const keyboardPadding = useKeyboardBottomPadding(
    Math.max(insets.bottom, Spacing.three),
    Spacing.three,
  );
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
      <KeyboardDismissSurface>
        <Animated.View style={[styles.column, keyboardPadding]}>
          <MessageList messages={messages} />
          <View style={styles.composer}>
            <SuperChatComposer
              draft={draft}
              onDraftChange={setDraft}
              onSubmit={handleSubmit}
              onNewChat={handleNewChat}
            />
          </View>
        </Animated.View>
      </KeyboardDismissSurface>
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
