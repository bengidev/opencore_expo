import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  FadeInUp,
  ReduceMotion,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { BoxShadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const WORD_INTERVAL_MS = 240;
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const WORD_ENTER = FadeInUp.duration(180).easing(EASE_OUT).reduceMotion(ReduceMotion.System);

type BubblePlacement = 'above' | 'below';

type OceanSpeechBubbleProps = {
  message: string;
  revision: number;
  maxWidth: number;
  placement: BubblePlacement;
  tailLeft: SharedValue<number>;
  onLayout: (size: { width: number; height: number }) => void;
  onPress: () => void;
};

export function OceanSpeechBubble({
  message,
  revision,
  maxWidth,
  placement,
  tailLeft,
  onLayout,
  onPress,
}: OceanSpeechBubbleProps) {
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

  const tailStyle = useAnimatedStyle(() => ({ left: tailLeft.get() }));
  const handleLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    onLayout({ width: layout.width, height: layout.height });
  };
  const tailOffset = placement === 'above' ? styles.tailBelow : styles.tailAbove;
  const tailFillOffset = placement === 'above' ? styles.tailFillBelow : styles.tailFillAbove;

  return (
    <Pressable
      onLayout={handleLayout}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${message}. Tap for the next message.`}
      style={[
        styles.bubble,
        {
          maxWidth,
          backgroundColor: theme.surface,
          borderColor: theme.border,
          boxShadow: BoxShadow.card,
        },
      ]}>
      <ThemedText variant="body" face="sans" themeColor="text">
        {words.slice(0, visibleCount).map((word, index) => (
          <Animated.Text key={`${revision}-${index}`} entering={WORD_ENTER}>
            {`${index === 0 ? '' : ' '}${word}`}
          </Animated.Text>
        ))}
      </ThemedText>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.tail,
          tailOffset,
          tailStyle,
          {
            borderTopColor: placement === 'above' ? theme.border : 'transparent',
            borderBottomColor: placement === 'below' ? theme.border : 'transparent',
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.tailFill,
          tailFillOffset,
          tailStyle,
          {
            marginLeft: 2,
            borderTopColor: placement === 'above' ? theme.surface : 'transparent',
            borderBottomColor: placement === 'below' ? theme.surface : 'transparent',
          },
        ]}
      />
    </Pressable>
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
  tail: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  tailFill: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  tailBelow: {
    bottom: -9,
    borderTopWidth: 9,
  },
  tailAbove: {
    top: -9,
    borderBottomWidth: 9,
  },
  tailFillBelow: {
    bottom: -7,
    borderTopWidth: 7,
  },
  tailFillAbove: {
    top: -7,
    borderBottomWidth: 7,
  },
});
