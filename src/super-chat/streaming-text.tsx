import { useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { STREAM_REVEAL_MS, tokenizeStreamingText } from '@/super-chat/streaming-timing';

const EASE_SMOOTH_OUT = Easing.bezier(0.23, 1, 0.32, 1);

type StreamingTextProps = {
  text: string;
  animate?: boolean;
  /** Applied to every word, since each one is its own Text view. */
  style?: StyleProp<TextStyle>;
};

/**
 * Renders a reply as a wrapping flow of word-sized `Text` views.
 *
 * Android flattens nested `<Text>` into virtual spans, and Reanimated cannot
 * animate a virtual component's `opacity` there; keeping every word as a
 * top-level `Text` gives each one a real view on both platforms. Each word
 * carries its own trailing whitespace, so punctuation stays attached.
 */
export function StreamingText({ text, animate = true, style }: StreamingTextProps) {
  const lines = useMemo(() => text.split('\n'), [text]);

  return (
    <View
      accessible
      accessibilityLabel={text}
      accessibilityRole="text"
      style={styles.container}>
      {lines.map((line, lineIndex) => (
        <View key={lineIndex} style={styles.line}>
          {(() => {
            const tokens = tokenizeStreamingText(line);
            return tokens.map((token, tokenIndex) => {
              if (token.wordIndex < 0) return null;

              const next = tokens[tokenIndex + 1];
              return (
                <StreamingWord
                  key={tokenIndex}
                  text={token.text}
                  trailing={next && next.wordIndex < 0 ? next.text : ''}
                  animate={animate}
                  style={style}
                />
              );
            });
          })()}
        </View>
      ))}
    </View>
  );
}

export type StreamingWordProps = {
  text: string;
  /** Whitespace that followed this word in the source, kept inside the view so punctuation stays attached. */
  trailing?: string;
  animate?: boolean;
  style?: StyleProp<TextStyle>;
  onPress?: () => void;
};

/**
 * One word that dissolves in over `STREAM_REVEAL_MS` from the moment it mounts.
 * A word is only known once it arrives, so mount is the only honest clock:
 * there is no schedule to delay against. This is a sibling of other words
 * rather than a child of a parent `Text`, which is what makes the opacity work
 * on Android.
 */
export function StreamingWord({
  text,
  trailing = '',
  animate = true,
  style,
  onPress,
}: StreamingWordProps) {
  const opacity = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (!animate) {
      opacity.value = 1;
      return;
    }

    opacity.value = withTiming(1, {
      duration: STREAM_REVEAL_MS,
      easing: EASE_SMOOTH_OUT,
    });
  }, [animate, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.Text
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onPress={onPress}
      style={[style, animatedStyle]}>
      {text}
      {trailing}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  line: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
  },
});
