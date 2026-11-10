import { StyleSheet } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { AgentActivity } from '@/components/agent-activity';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ChatMessage } from '@/super-chat/chat-message';
import { reasoningActivity } from './reasoning-activity.ts';
import { StreamingText } from '@/super-chat/streaming-text';

/**
 * The model's working, above the answer. The trace is a single text row so the
 * activity shell owns the folding: open while it streams, folded to the
 * duration once it settles.
 */
export function ReasoningActivity({ message }: { message: ChatMessage }) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const activity = reasoningActivity(message);
  if (!activity) return null;
  const working = activity.status === 'working';

  return (
    <AgentActivity
      contentType="text"
      status={activity.status}
      duration={activity.duration}
      activeLabel={activity.activeLabel}
      summary={activity.summary}
      items={[
        {
          id: activity.id,
          type: 'text',
          content: (
            <StreamingText
              text={activity.text}
              animate={working && !reduced}
              style={[styles.trace, { color: theme.textSecondary }]}
            />
          ),
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  trace: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 21,
  },
});
