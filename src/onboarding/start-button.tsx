import * as Haptics from 'expo-haptics';
import { Shimmer } from 'panelui-native/components/shimmer';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { cubicBezier, useReducedMotion } from 'react-native-reanimated';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const PRESS_EASE = cubicBezier(0.23, 1, 0.32, 1);

export function OnboardingStartButton({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Get started"
      onPress={onPress}
      onPressIn={() => {
        setPressed(true);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }}
      onPressOut={() => setPressed(false)}
      pressRetentionOffset={{ top: 16, left: 16, right: 16, bottom: 16 }}>
      <Animated.View
        style={[
          styles.button,
          { backgroundColor: theme.textDisplay },
          reducedMotion
            ? {
                transitionProperty: 'opacity',
                transitionDuration: 140,
                transitionTimingFunction: PRESS_EASE,
                opacity: pressed ? 0.65 : 1,
              }
            : {
                transitionProperty: 'transform',
                transitionDuration: 140,
                transitionTimingFunction: PRESS_EASE,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
        ]}>
        <Shimmer
          as="text"
          className="text-muted-foreground text-foreground"
          baseColor={theme.textDisabled}
          shimmerColor={theme.background}
          textStyle={styles.label}>
          GET STARTED →
        </Shimmer>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 0.78,
    fontWeight: 400,
  },
});
