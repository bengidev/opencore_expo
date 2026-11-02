import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { cubicBezier, useReducedMotion } from 'react-native-reanimated';

import { NativeSurface } from '@/components/native-surface';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import type { HomeSuggestion } from '@/home/home-content';

const PRESS_EASE = cubicBezier(0.23, 1, 0.32, 1);

type SuggestionCardProps = {
  suggestion: HomeSuggestion;
  onPress: (suggestion: HomeSuggestion) => void;
};

export function SuggestionCard({ suggestion, onPress }: SuggestionCardProps) {
  const reducedMotion = useReducedMotion();
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={suggestion.title}
      onPress={() => onPress(suggestion)}
      onPressIn={() => {
        setPressed(true);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }}
      onPressOut={() => setPressed(false)}
      style={styles.pressable}>
      <Animated.View
        style={[
          reducedMotion
            ? {
                transitionProperty: 'opacity',
                transitionDuration: 160,
                transitionTimingFunction: PRESS_EASE,
                opacity: pressed ? 0.88 : 1,
              }
            : {
                transitionProperty: 'transform',
                transitionDuration: 160,
                transitionTimingFunction: PRESS_EASE,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
        ]}>
        {/* Floating over the ocean means a real glass material where the system
            has one, a filled Material container on Android, and the app's own
            surface — stroke included — only where neither exists. */}
        <NativeSurface tone="glass" radius={Radius.card} style={styles.card}>
          <ThemedText variant="bodySm" face="sansBold" themeColor="text" numberOfLines={3}>
            {suggestion.title}
          </ThemedText>
          {suggestion.subtitle ? (
            <ThemedText
              variant="caption"
              themeColor="textSecondary"
              numberOfLines={2}
              style={styles.subtitle}>
              {suggestion.subtitle}
            </ThemedText>
          ) : null}
        </NativeSurface>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: 168,
  },
  card: {
    minHeight: 88,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: Spacing.one,
  },
});
