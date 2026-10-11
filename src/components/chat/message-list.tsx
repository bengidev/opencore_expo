import { useRef } from 'react';
import { FlatList, StyleSheet, type ListRenderItem } from 'react-native';

import { MessageBubble } from '@/components/chat/message-bubble';
import { Spacing } from '@/constants/theme';
import type { ChatMessage } from '@/types/chat';

export function MessageList({ messages }: { messages: ChatMessage[] }) {
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const renderItem: ListRenderItem<ChatMessage> = ({ item }) => <MessageBubble message={item} />;

  return (
    <FlatList
      ref={listRef}
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      onContentSizeChange={() => {
        listRef.current?.scrollToEnd({ animated: true });
      }}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
});
