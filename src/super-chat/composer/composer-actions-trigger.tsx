import { Pressable, StyleSheet } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { NativeSurface } from '@/components/native-surface';
import { useTheme } from '@/hooks/use-theme';
import { isIosGlass } from '@/lib/ui-tier';

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
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

type ComposerActionsTriggerProps = {
  /**
   * Leave unset to get the platform's own control: glass on iOS 26, a filled
   * Material button on Android, the app's bordered circle everywhere else.
   */
  variant?: ComposerControlVariant;
  onPress: () => void;
};

export function ComposerActionsTrigger({ variant, onPress }: ComposerActionsTriggerProps) {
  const theme = useTheme();
  const resolved = variant ?? (isIosGlass ? 'glass' : 'raised');

  if (resolved === 'plain') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open actions"
        testID="composer-actions-trigger"
        onPress={onPress}
        hitSlop={4}
        style={({ pressed }) => [composerTriggerStyles.trigger, pressed && { opacity: 0.55 }]}>
        <AppIcon ios="plus" android="add" size={20} color={theme.textSecondary} />
      </Pressable>
    );
  }

  return (
    <NativeSurface
      tone={resolved === 'glass' ? 'glass' : 'raised'}
      radius={18}
      interactive
      style={composerTriggerStyles.circle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open actions"
        testID="composer-actions-trigger"
        onPress={onPress}
        style={composerTriggerStyles.trigger}>
        <AppIcon ios="plus" android="add" size={20} color={theme.textDisplay} />
      </Pressable>
    </NativeSurface>
  );
}
