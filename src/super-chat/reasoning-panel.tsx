import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Reasoning } from 'panelui-native/components/reasoning';
import { Shimmer } from 'panelui-native/components/shimmer';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { StreamingText } from '@/super-chat/streaming-text';

type ReasoningPanelProps = {
  text: string;
  streaming: boolean;
  /** Whole seconds, measured once the trace has finished. */
  duration?: number;
};

/**
 * The model's working, above the answer. PanelUI's `Reasoning` owns the
 * behaviour — open while it streams, fold a second after it stops, stay open
 * once the reader reopens it — and the trace itself uses the same per-word
 * dissolve as the answer, only faster.
 */
const AUTO_CLOSE_DELAY_MS = 1000;

export function ReasoningPanel({ text, streaming, duration }: ReasoningPanelProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(streaming);
  const manualToggleRef = useRef(false);

  // PanelUI's automatic lifecycle is driven by `isStreaming`, but the whole
  // card should toggle, not only its header. Drive the same lifecycle here so
  // a manual toggle can interrupt it cleanly.
  useEffect(() => {
    if (streaming && !manualToggleRef.current) {
      setOpen(true);
    }
  }, [streaming]);

  useEffect(() => {
    if (streaming || !open || manualToggleRef.current) return;
    const timer = setTimeout(() => setOpen(false), AUTO_CLOSE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [open, streaming]);

  function toggle() {
    manualToggleRef.current = true;
    setOpen((current) => !current);
  }

  return (
    <Reasoning
      isStreaming={false}
      defaultOpen={false}
      open={open}
      onOpenChange={setOpen}
      duration={duration}
      style={[
        styles.root,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}>
      <Reasoning.Trigger
        onPress={() => {
          manualToggleRef.current = true;
        }}
        label={() =>
          streaming ? (
            <Shimmer
              as="text"
              duration={1200}
              baseColor={theme.textSecondary}
              shimmerColor={theme.text}
              textStyle={styles.label}>
              THINKING…
            </Shimmer>
          ) : (
            <ThemedText variant="label" themeColor="textSecondary" style={styles.label}>
              {`THOUGHT FOR ${duration ?? 1} SECOND${(duration ?? 1) === 1 ? '' : 'S'}`}
            </ThemedText>
          )
        }
      />
      <Pressable accessible={false} onPress={toggle}>
        <Reasoning.Content>
          <View style={styles.trace}>
            <StreamingText
              text={text}
              animate={streaming}
              style={[styles.traceText, { color: theme.textSecondary }]}
            />
          </View>
        </Reasoning.Content>
      </Pressable>
    </Reasoning>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  label: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    lineHeight: 13.2,
    letterSpacing: 0.88,
  },
  trace: {
    paddingBottom: Spacing.one,
  },
  traceText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 21,
  },
});
