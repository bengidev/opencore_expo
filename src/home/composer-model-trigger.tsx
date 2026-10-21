import { Pressable, StyleSheet } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ComposerControlVariant } from '@/home/composer-actions-trigger';
import type { HomeModel } from '@/home/home-models';

type ComposerModelTriggerProps = {
  model: HomeModel;
  variant: ComposerControlVariant;
  onPress: () => void;
};

/** Fallback trigger for web and platforms without a native chip. */
export function ComposerModelTrigger({
  model,
  variant,
  onPress,
}: ComposerModelTriggerProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Model, ${model.name}`}
      testID="composer-model-trigger"
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          borderColor: theme.borderVisible,
          backgroundColor: variant === 'glass' ? theme.surface : theme.surfaceRaised,
        },
        pressed && { opacity: 0.7 },
      ]}>
      <AppIcon
        ios={model.iosSymbol}
        android={model.fallbackIcon}
        size={16}
        color={theme.text}
      />
      <ThemedText variant="bodySm" themeColor="text">
        {model.name}
      </ThemedText>
      <AppIcon
        ios="chevron.down"
        android="keyboard-arrow-down"
        size={16}
        color={theme.textSecondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: Spacing.two,
    height: 36,
  },
});
