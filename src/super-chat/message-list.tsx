import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, type ListRenderItem } from 'react-native';
import Animated from 'react-native-reanimated';

import { MessageBubble } from '@/super-chat/message-bubble';
import { Spacing } from '@/constants/theme';
import type { ChatMessage } from '@/super-chat/chat-message';

export function MessageList({ messages }: { messages: ChatMessage[] }) {
  const listRef = useRef<Animated.FlatList<ChatMessage>>(null);
  const followLatestRef = useRef(true);
  const lastUserMessageIdRef = useRef<string | null>(null);
  const listHeightRef = useRef(0);
  const scrollFrameRef = useRef<number | null>(null);

  const renderItem: ListRenderItem<ChatMessage> = ({ item }) => <MessageBubble message={item} />;

  useEffect(() => {
    return () => {
      if (scrollFrameRef.current !== null) cancelAnimationFrame(scrollFrameRef.current);
    };
  }, []);

  useEffect(() => {
    const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user');
    const sentMessage =
      lastUserMessage !== undefined && lastUserMessage.id !== lastUserMessageIdRef.current;

    lastUserMessageIdRef.current = lastUserMessage?.id ?? null;

    // A sent message should always bring the thread back to the composer. An
    // assistant reply only follows the reader when they were already at the
    // bottom; otherwise it would yank them out of an earlier message.
    if (sentMessage) {
      followLatestRef.current = true;
    }
    if (!followLatestRef.current) return;

    const frame = requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: sentMessage });
    });
    return () => cancelAnimationFrame(frame);
  }, [messages]);

  return (
    <Animated.FlatList
      ref={listRef}
      style={styles.list}
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      onLayout={(event) => {
        const height = event.nativeEvent.layout.height;
        const previous = listHeightRef.current;
        listHeightRef.current = height;

        // A shrinking viewport is the keyboard opening. Keep the bottom
        // anchored so the newest message rides above it instead of ending up
        // behind the composer.
        if (height >= previous || !followLatestRef.current) return;
        if (scrollFrameRef.current !== null) return;

        scrollFrameRef.current = requestAnimationFrame(() => {
          scrollFrameRef.current = null;
          listRef.current?.scrollToEnd({ animated: false });
        });
      }}
      onScrollBeginDrag={() => {
        followLatestRef.current = false;
      }}
      onScroll={(event) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const distanceFromEnd =
          contentSize.height - (contentOffset.y + layoutMeasurement.height);
        if (distanceFromEnd <= 32) {
          followLatestRef.current = true;
        }
      }}
      scrollEventThrottle={16}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
  },
});
