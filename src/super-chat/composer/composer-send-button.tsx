import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { cubicBezier, useReducedMotion } from 'react-native-reanimated';

import { AppIcon } from '@/components/app-icon';
import { AppMetalFx } from '@/components/app-metal-fx';
import { useTheme } from '@/hooks/use-theme';

const PRESS_EASE = cubicBezier(0.23, 1, 0.32, 1);
const PRESS_SCALE = 0.97;
const ORB_SIZE = 36;
const ORB_RADIUS = 18;

type ComposerSendButtonProps = {
  enabled: boolean;
  metalActive: boolean;
  onPress: () => void;
};

export function ComposerSendButton({ enabled, metalActive, onPress }: ComposerSendButtonProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const fill = enabled ? theme.textDisplay : theme.borderVisible;
  const iconColor = enabled ? theme.background : theme.textDisabled;
  const isPressed = pressed && enabled;

  return (
    <Animated.View
      style={[
        styles.shell,
        reducedMotion
          ? {
              transitionProperty: 'opacity',
              transitionDuration: 120,
              transitionTimingFunction: PRESS_EASE,
              opacity: isPressed ? 0.72 : 1,
            }
          : {
              transitionProperty: 'transform',
              transitionDuration: isPressed ? 140 : 120,
              transitionTimingFunction: PRESS_EASE,
              transform: [{ scale: isPressed ? PRESS_SCALE : 1 }],
            },
      ]}>
      <AppMetalFx
        variant="circle"
        cornerRadius={ORB_RADIUS}
        innerShadow
        fill={fill}
        strength={enabled ? 1 : 0.5}
        paused={!metalActive}
        style={styles.metalWrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send message"
          accessibilityState={{ disabled: !enabled }}
          disabled={!enabled}
          onPress={onPress}
          onPressIn={() => {
            if (!enabled) return;
            setPressed(true);
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          }}
          onPressOut={() => setPressed(false)}
          hitSlop={6}
          style={styles.sendHit}>
          <View style={[styles.sendOrb, { backgroundColor: fill }]}>
            <AppIcon ios="arrow.up" android="arrow-upward" size={18} color={iconColor} />
          </View>
        </Pressable>
      </AppMetalFx>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: {
    padding: 2,
  },
  metalWrap: {
    overflow: 'visible',
  },
  sendHit: {
    width: ORB_SIZE,
    height: ORB_SIZE,
  },
  sendOrb: {
    width: ORB_SIZE,
    height: ORB_RADIUS * 2,
    borderRadius: ORB_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
