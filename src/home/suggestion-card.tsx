import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { cubicBezier, useReducedMotion } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { BoxShadow, Radius, Spacing } from '@/constants/theme';
import type { HomeSuggestion } from '@/home/home-content';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

const PRESS_EASE = cubicBezier(0.23, 1, 0.32, 1);

type SuggestionCardProps = {
  suggestion: HomeSuggestion;
  onPress: (suggestion: HomeSuggestion) => void;
};

export function SuggestionCard({ suggestion, onPress }: SuggestionCardProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const cardShadow = colorScheme === 'dark' ? BoxShadow.cardDark : BoxShadow.card;
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
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            boxShadow: cardShadow,
          },
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
        <ThemedText variant="bodySm" face="sansBold" themeColor="text" numberOfLines={3}>
          {suggestion.title}
        </ThemedText>
        {suggestion.subtitle ? (
          <ThemedText variant="caption" themeColor="textSecondary" numberOfLines={2} style={styles.subtitle}>
            {suggestion.subtitle}
          </ThemedText>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: 168,
    marginVertical: Spacing.one,
  },
  card: {
    minHeight: 88,
    borderWidth: 1,
    borderRadius: Radius.surface,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: Spacing.one,
  },
});
