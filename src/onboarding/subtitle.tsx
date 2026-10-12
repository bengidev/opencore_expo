import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export function OnboardingSubtitle() {
  return (
    <ThemedText face="sans" themeColor="textSecondary" style={styles.subtitle}>
      Get instant help and support with any task or problem
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 400,
    textAlign: 'center',
  },
});
