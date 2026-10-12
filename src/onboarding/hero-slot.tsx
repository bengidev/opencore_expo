import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/** Monochrome stand-in. This is the only component that should later render BotAvatar. */
export function OnboardingHero() {
  const theme = useTheme();

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.circle, { borderColor: theme.borderVisible }]}
    />
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
});
