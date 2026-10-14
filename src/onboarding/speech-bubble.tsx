import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  FadeInUp,
  LinearTransition,
  ReduceMotion,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

const WORD_INTERVAL_MS = 240;
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const WORD_ENTER = FadeInUp.duration(180).easing(EASE_OUT).reduceMotion(ReduceMotion.System);
export const BUBBLE_LAYOUT = LinearTransition.duration(180)
  .easing(EASE_OUT)
  .reduceMotion(ReduceMotion.System);

export const ONBOARDING_SPEECH_LINES = [
  'Hello! Ready to explore?',
  "I'm here for any task.",
  "Let's get started.",
] as const;

export type OnboardingSpeechSize = { width: number; height: number };

type OnboardingSpeechProps = {
  message: string;
  revision: number;
  maxWidth: number;
  tailLeft: number;
  onLayout: (size: OnboardingSpeechSize) => void;
};

export function OnboardingSpeech({
  message,
  revision,
  maxWidth,
  tailLeft,
  onLayout,
}: OnboardingSpeechProps) {
  const theme = useTheme();
  const words = useMemo(() => message.trim().split(/\s+/).filter(Boolean), [message]);
  const [reveal, setReveal] = useState({ revision, count: 0 });
  const visibleCount = reveal.revision === revision ? reveal.count : 0;

  useEffect(() => {
    if (words.length === 0) return;

    let count = 0;
    const timer = setInterval(() => {
      count += 1;
      setReveal({ revision, count });
      if (count >= words.length) clearInterval(timer);
    }, WORD_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [message, revision, words]);

  const handleLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    onLayout({ width: layout.width, height: layout.height });
  };

  return (
    <View
      onLayout={handleLayout}
      accessibilityRole="text"
      accessibilityLabel={message}
      style={[
        styles.bubble,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          maxWidth,
        },
      ]}>
      <ThemedText face="sans" themeColor="text" style={styles.label}>
        {words.slice(0, visibleCount).map((word, index) => (
          <Animated.Text key={`${revision}-${index}`} entering={WORD_ENTER}>
            {`${index === 0 ? '' : ' '}${word}`}
          </Animated.Text>
        ))}
      </ThemedText>
      <View style={[styles.tailBorder, { left: tailLeft, borderTopColor: theme.border }]} />
      <View style={[styles.tailFill, { left: tailLeft + 2, borderTopColor: theme.surface }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    alignSelf: 'flex-start',
    minWidth: 64,
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  label: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 400,
  },
  tailBorder: {
    position: 'absolute',
    bottom: -9,
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderTopWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  tailFill: {
    position: 'absolute',
    bottom: -7,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
