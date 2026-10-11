import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ChatMessage } from '@/types/chat';

export function MessageBubble({ message }: { message: ChatMessage }) {
  const theme = useTheme();
  const isUser = message.role === 'user';

  return (
    <ThemedText
      type="default"
      themeColor={isUser ? 'onAccent' : 'text'}
      style={[
        styles.bubble,
        isUser ? styles.user : styles.assistant,
        { backgroundColor: isUser ? theme.accent : theme.backgroundElement },
      ]}>
      {message.text}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '82%',
    overflow: 'hidden',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  user: {
    alignSelf: 'flex-end',
  },
  assistant: {
    alignSelf: 'flex-start',
  },
});
