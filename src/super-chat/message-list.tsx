import { useEffect, useRef } from 'react';
import { StyleSheet, type ListRenderItem } from 'react-native';
import Animated from 'react-native-reanimated';

import { CHAT_BUBBLE_LAYOUT, MessageBubble } from '@/super-chat/message-bubble';
import { Spacing } from '@/constants/theme';
import type { ChatMessage } from '@/super-chat/chat-message';

export function MessageList({ messages }: { messages: ChatMessage[] }) {
  const listRef = useRef<Animated.FlatList<ChatMessage>>(null);

  const renderItem: ListRenderItem<ChatMessage> = ({ item }) => <MessageBubble message={item} />;

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [messages.length]);

  return (
    <Animated.FlatList
      ref={listRef}
      style={styles.list}
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      itemLayoutAnimation={CHAT_BUBBLE_LAYOUT}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      onContentSizeChange={() => {
        listRef.current?.scrollToEnd({ animated: true });
      }}
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
