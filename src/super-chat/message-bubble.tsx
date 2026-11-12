import { router } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Keyframe, ReduceMotion, useReducedMotion } from 'react-native-reanimated';
import { ThinkingOrb } from 'panelui-native/components/thinking-orb';

import { resolveThinkingOrbStyle } from '@/components/agent-activity/orb-style';
import { useThinkingOrbPreference } from '@/components/agent-activity/orb-style-store';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ChatMessage } from '@/super-chat/chat-message';
import type { ChatErrorCode } from '@/super-chat/llm/types';
// The mapping module shares this basename; the extension selects the component.
import { ReasoningActivity } from '@/super-chat/reasoning-activity.tsx';
import { MarkdownAnswer } from '@/super-chat/markdown-answer';

const ENTER_MS = 200;
/** Brief pause so the assistant reply reads as a follow-up, not simultaneous with the user send. */
const ASSISTANT_ENTER_DELAY_MS = 55;

/** The key editor modal; also the destination of the "Add an API key" action. */
const API_KEY_ROUTE = '/api-key';

const KEY_ERRORS: ReadonlySet<ChatErrorCode> = new Set<ChatErrorCode>([
  'missing-key',
  'invalid-key',
]);

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

type MessageBubbleProps = {
  message: ChatMessage;
  /** Absent when the bubble is not allowed to restart the conversation. */
  onRetry?: (id: string) => void;
};

export const MessageBubble = memo(function MessageBubble({ message, onRetry }: MessageBubbleProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  // Waiting for the first token is a text answer forming, so `auto` draws the
  // composing orb; a pinned style applies here like everywhere else.
  const pendingOrbStyle = resolveThinkingOrbStyle(useThinkingOrbPreference(), 'text');
  const isUser = message.role === 'user';
  const entering = isUser ? userBubbleEntering : assistantBubbleEntering;
  const showReasoning = message.role === 'assistant' && message.reasoning.length > 0;
  // The answer stays hidden while the trace is still arriving; the trace is the
  // only thing that should be moving at that point.
  const showAnswer = !message.reasoningStreaming;
  const error = message.error;
  // A terminal reply can be empty — interrupted before its first token, or a
  // key error — and an empty bubble would just be a gap in the thread.
  const showBubble = isUser || message.text !== '';
  const showPending = !isUser && !showBubble && error === undefined && message.streaming;

  return (
    <Animated.View
      entering={entering}
      style={[styles.shell, isUser ? styles.user : styles.assistant]}>
      {showReasoning ? (
        <ReasoningActivity message={message} />
      ) : null}

      {showAnswer && showBubble ? (
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
            <MarkdownAnswer
              text={message.text}
              streaming={message.streaming && !reducedMotion}
            />
          )}
        </View>
      ) : null}

      {showAnswer && showPending ? (
        <View
          style={[
            styles.bubble,
            styles.pending,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}>
          <View style={styles.pendingOrb}>
            <ThinkingOrb
              state={pendingOrbStyle}
              size={20}
              color={theme.text}
              accessibilityLabel="Thinking"
            />
          </View>
        </View>
      ) : null}

      {error !== undefined ? (
        <View style={styles.error}>
          <ThemedText
            type="small"
            themeColor="error"
            accessibilityRole="alert"
            accessibilityLiveRegion="polite">
            {error.message}
          </ThemedText>
          <View style={styles.actions}>
            {error.retryable && onRetry !== undefined ? (
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                style={styles.action}
                onPress={() => onRetry(message.id)}>
                <ThemedText type="link" themeColor="interactive">
                  Retry
                </ThemedText>
              </Pressable>
            ) : null}
            {KEY_ERRORS.has(error.code) ? (
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                style={styles.action}
                onPress={() => router.push(API_KEY_ROUTE)}>
                <ThemedText type="link" themeColor="interactive">
                  Add an API key
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
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
  pending: {
    borderWidth: 1,
  },
  pendingOrb: {
    height: 24,
    justifyContent: 'center',
  },
  error: {
    gap: Spacing.one,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  // Text-sized links still need the 44 pt touch target the platform expects.
  action: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
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
