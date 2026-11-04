import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Keyframe, ReduceMotion } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ChatMessage } from '@/super-chat/chat-message';
import { ReasoningPanel } from '@/super-chat/reasoning-panel';
import { StreamingMarkdown } from '@/super-chat/streaming-markdown';

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

export const MessageBubble = memo(function MessageBubble({ message }: { message: ChatMessage }) {
  const theme = useTheme();
  const isUser = message.role === 'user';
  const entering = isUser ? userBubbleEntering : assistantBubbleEntering;
  const showReasoning = message.role === 'assistant' && message.reasoning.length > 0;
  // The answer stays hidden while the trace is still arriving; the trace is the
  // only thing that should be moving at that point.
  const showAnswer = !message.reasoningStreaming;

  return (
    <Animated.View
      entering={entering}
      style={[styles.shell, isUser ? styles.user : styles.assistant]}>
      {showReasoning ? (
        <ReasoningPanel
          text={message.reasoning}
          streaming={message.reasoningStreaming}
          duration={message.reasoningDuration}
        />
      ) : null}

      {showAnswer ? (
        <View
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
          {isUser ? (
            <ThemedText type="default" themeColor="background">
              {message.text}
            </ThemedText>
          ) : (
            <StreamingMarkdown text={message.text} animate={message.streaming} />
          )}
        </View>
      ) : null}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  shell: {
    maxWidth: '84%',
    gap: Spacing.two,
  },
  bubble: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    overflow: 'hidden',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  user: {
    alignSelf: 'flex-end',
    maxWidth: '82%',
  },
  assistant: {
    alignSelf: 'flex-start',
    width: '84%',
  },
});
