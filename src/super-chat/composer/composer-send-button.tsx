import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { cubicBezier, useReducedMotion } from 'react-native-reanimated';

import { AppIcon } from '@/components/app-icon';
import { AppMetalFx } from '@/components/app-metal-fx';
import { NativeSurface } from '@/components/native-surface';
import { useTheme } from '@/hooks/use-theme';
import { isAndroidMaterial, isIosGlass } from '@/lib/ui-tier';

const PRESS_EASE = cubicBezier(0.23, 1, 0.32, 1);
const PRESS_SCALE = 0.97;
const ORB_SIZE = 36;
const ORB_RADIUS = 18;

type ComposerSendButtonProps = {
  enabled: boolean;
  /** While a reply streams the primary control stops it instead of sending. */
  mode?: 'send' | 'stop';
  metalActive: boolean;
  onPress: () => void;
};

/**
 * The send control. Liquid Glass answers to the touch where the system has it,
 * Material fills a tonal circle on Android, and the app's own metal orb is only
 * painted when neither platform surface exists.
 */
export function ComposerSendButton({
  enabled,
  mode = 'send',
  metalActive,
  onPress,
}: ComposerSendButtonProps) {
  const isStop = mode === 'stop';
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const fill = enabled
    ? theme.textDisplay
    : isIosGlass || isAndroidMaterial
      ? theme.surfaceRaised
      : theme.borderVisible;
  const iconColor = enabled
    ? theme.background
    : isIosGlass || isAndroidMaterial
      ? theme.textSecondary
      : theme.textDisabled;
  const isPressed = pressed && enabled;

  function handlePressIn() {
    if (!enabled) return;
    setPressed(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }

  function renderFace(orbFill: string, tint: string) {
    return (
      <Pressable
        testID={isStop ? 'composer-stop' : 'composer-send'}
        accessibilityRole="button"
        accessibilityLabel={isStop ? 'Stop' : 'Send message'}
        accessibilityState={{ disabled: !enabled }}
        disabled={!enabled}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={() => setPressed(false)}
        hitSlop={6}
        style={styles.sendHit}>
        <View style={[styles.sendOrb, { backgroundColor: orbFill }]}>
          <AppIcon
            ios={isStop ? 'stop.fill' : 'arrow.up'}
            android={isStop ? 'stop' : 'arrow-upward'}
            size={18}
            color={tint}
          />
        </View>
      </Pressable>
    );
  }

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
      {isIosGlass ? (
        <NativeSurface
          tone="glass"
          radius={ORB_RADIUS}
          interactive={enabled}
          style={styles.glassOrb}>
          {/* A glass rim around a filled orb: the system material gives the
              touch response, the fill keeps the control legible on any canvas. */}
          {renderFace(fill, iconColor)}
        </NativeSurface>
      ) : isAndroidMaterial ? (
        renderFace(fill, iconColor)
      ) : (
        <AppMetalFx
          variant="circle"
          cornerRadius={ORB_RADIUS}
          innerShadow
          fill={fill}
          strength={enabled ? 1 : 0.5}
          paused={!metalActive}
          style={styles.metalWrap}>
          {renderFace(fill, iconColor)}
        </AppMetalFx>
      )}
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
  glassOrb: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
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
