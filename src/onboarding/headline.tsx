import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export function OnboardingHeadline() {
  return (
    <ThemedText face="sans" themeColor="textDisplay" style={styles.headline}>
      Your Smart Assistant for Any Tasks
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  headline: {
    fontSize: 36,
    lineHeight: 39.6,
    letterSpacing: -0.72,
    fontWeight: 400,
    textAlign: 'center',
  },
});
