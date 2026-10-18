import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AppIcon } from '@/components/app-icon';
import { AppMetalFx } from '@/components/app-metal-fx';
import { useTheme } from '@/hooks/use-theme';

/** Strong ease-out (Emil Kowalski / easing.dev style punch). */
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const PRESS_IN_MS = 140;
const PRESS_OUT_MS = 120;
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
  const scale = useSharedValue(1);
  const pressOpacity = useSharedValue(1);

  const fill = enabled ? theme.textDisplay : theme.borderVisible;
  const iconColor = enabled ? theme.background : theme.textDisabled;

  const animatedShell = useAnimatedStyle(() => {
    if (reducedMotion) {
      return { opacity: pressOpacity.value };
    }
    return { transform: [{ scale: scale.value }] };
  });

  function onPressIn() {
    if (!enabled) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (reducedMotion) {
      pressOpacity.value = withTiming(0.72, { duration: 100, easing: EASE_OUT });
      return;
    }
    scale.value = withTiming(PRESS_SCALE, { duration: PRESS_IN_MS, easing: EASE_OUT });
  }

  function onPressOut() {
    if (reducedMotion) {
      pressOpacity.value = withTiming(1, { duration: 140, easing: EASE_OUT });
      return;
    }
    scale.value = withTiming(1, { duration: PRESS_OUT_MS, easing: EASE_OUT });
  }

  return (
    <Animated.View style={[styles.shell, animatedShell]}>
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
          onPressIn={onPressIn}
          onPressOut={onPressOut}
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
