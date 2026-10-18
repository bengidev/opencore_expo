import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ONBOARDING_FOOTNOTE } from '@/onboarding/footer-copy';

export function OnboardingSubtitle() {
  return (
    <ThemedText
      accessibilityLabel={ONBOARDING_FOOTNOTE}
      variant="bodySm"
      face="sans"
      themeColor="textSecondary"
      style={styles.subtitle}>
      {ONBOARDING_FOOTNOTE}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    alignSelf: 'center',
    maxWidth: 320,
    textAlign: 'justify',
  },
});
