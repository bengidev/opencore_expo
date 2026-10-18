import { StyleSheet } from 'react-native';
import Animated, { Easing, Keyframe, LinearTransition, ReduceMotion } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ChatMessage } from '@/types/chat';

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const ENTER_MS = 200;
/** Brief pause so the assistant reply reads as a follow-up, not simultaneous with the user send. */
const ASSISTANT_ENTER_DELAY_MS = 55;

const userBubbleEntering = new Keyframe({
  0: {
    opacity: 0,
    transform: [{ translateX: 14 }, { scale: 0.97 }],
  },
  100: {
    opacity: 1,
    transform: [{ translateX: 0 }, { scale: 1 }],
  },
})
  .duration(ENTER_MS)
  .reduceMotion(ReduceMotion.System);

const assistantBubbleEntering = new Keyframe({
  0: {
    opacity: 0,
    transform: [{ translateX: -14 }, { scale: 0.97 }],
  },
  100: {
    opacity: 1,
    transform: [{ translateX: 0 }, { scale: 1 }],
  },
})
  .duration(ENTER_MS)
  .delay(ASSISTANT_ENTER_DELAY_MS)
  .reduceMotion(ReduceMotion.System);

export const CHAT_BUBBLE_LAYOUT = LinearTransition.duration(ENTER_MS)
  .easing(EASE_OUT)
  .reduceMotion(ReduceMotion.System);

export function MessageBubble({ message }: { message: ChatMessage }) {
  const theme = useTheme();
  const isUser = message.role === 'user';
  const entering = isUser ? userBubbleEntering : assistantBubbleEntering;

  return (
    <Animated.View
      entering={entering}
      layout={CHAT_BUBBLE_LAYOUT}
      style={[styles.shell, isUser ? styles.user : styles.assistant]}>
      <ThemedText
        type="default"
        themeColor={isUser ? 'background' : 'text'}
        style={[
          styles.bubble,
          isUser
            ? { backgroundColor: theme.textDisplay }
            : {
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.border,
              },
        ]}>
        {message.text}
      </ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: {
    maxWidth: '82%',
  },
  bubble: {
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
