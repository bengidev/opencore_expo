import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export function OnboardingHeadline() {
  return (
    <ThemedText face="displayBold" themeColor="textDisplay" style={styles.headline}>
      Your Smart Assistant for Any Tasks
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  headline: {
    fontSize: 36,
    lineHeight: 44,
    // Doto carries wide side bearings; a tight sans tracking collides the dots.
    letterSpacing: -0.36,
    textAlign: 'center',
  },
});
