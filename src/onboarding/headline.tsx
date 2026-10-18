import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export function OnboardingHeadline() {
  return (
    <ThemedText variant="displayMd" face="display" themeColor="textDisplay" style={styles.headline}>
      Your Smart Assistant for Any Tasks
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  headline: {
    textAlign: 'center',
  },
});
