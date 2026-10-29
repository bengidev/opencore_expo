import { Pressable, StyleSheet } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { LiquidGlassView } from '@/components/liquid-glass-view';
import { useTheme } from '@/hooks/use-theme';

export type ComposerControlVariant = 'glass' | 'raised' | 'plain';

export const composerTriggerStyles = StyleSheet.create({
  slot: {
    width: 36,
    height: 36,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trigger: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

type ComposerActionsTriggerProps = {
  variant: ComposerControlVariant;
  onPress: () => void;
};

export function ComposerActionsTrigger({ variant, onPress }: ComposerActionsTriggerProps) {
  const theme = useTheme();

  if (variant === 'plain') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open actions"
        testID="composer-actions-trigger"
        onPress={onPress}
        hitSlop={4}
        style={({ pressed }) => [
          composerTriggerStyles.trigger,
          pressed && { opacity: 0.55 },
        ]}>
        <AppIcon ios="plus" android="add" size={20} color={theme.textSecondary} />
      </Pressable>
    );
  }

  if (variant === 'glass') {
    return (
      <LiquidGlassView isInteractive style={composerTriggerStyles.glassCircle}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open actions"
          testID="composer-actions-trigger"
          onPress={onPress}
          style={composerTriggerStyles.trigger}>
          <AppIcon ios="plus" android="add" size={20} color={theme.textDisplay} />
        </Pressable>
      </LiquidGlassView>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open actions"
      testID="composer-actions-trigger"
      onPress={onPress}
      style={({ pressed }) => [
        composerTriggerStyles.circleButton,
        { borderColor: theme.borderVisible, backgroundColor: theme.surface },
        pressed && { opacity: 0.7 },
      ]}>
      <AppIcon ios="plus" android="add" size={20} color={theme.textDisplay} />
    </Pressable>
  );
}
