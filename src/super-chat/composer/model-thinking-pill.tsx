import { StyleSheet, View, type AccessibilityProps } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  THINKING_LEVEL_LABELS,
  type ThinkingLevel,
} from '@/super-chat/composer/chat-models';
import {
  THINKING_TRIGGER_HEIGHT,
  THINKING_TRIGGER_WIDTH,
} from '@/super-chat/composer/model-sheet-metrics';

type ThinkingLevelPillProps = {
  level: ThinkingLevel;
} & Pick<
  AccessibilityProps,
  'accessibilityLabel' | 'accessibilityHint' | 'accessibilityRole' | 'accessibilityState'
>;

/**
 * The plain-React-Native thinking trigger used on Android and the web. iOS gets
 * the native SwiftUI menu instead, where the trigger renders as Liquid Glass on
 * iOS 26 and later.
 */
export function ThinkingLevelPill({
  level,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  accessibilityState,
}: ThinkingLevelPillProps) {
  const theme = useTheme();

  return (
    <View
      accessible={accessibilityLabel != null}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      style={[styles.pill, { borderColor: theme.borderVisible }]}>
      <ThemedText variant="label" themeColor="textSecondary" numberOfLines={1}>
        {THINKING_LEVEL_LABELS[level]}
      </ThemedText>
      <AppIcon
        ios="chevron.down"
        android="keyboard-arrow-down"
        size={11}
        color={theme.textSecondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    width: THINKING_TRIGGER_WIDTH,
    height: THINKING_TRIGGER_HEIGHT,
    borderRadius: Radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
});
