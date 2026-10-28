import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export function HomePrompt() {
  return (
    <ThemedText
      face="sansLight"
      themeColor="text"
      accessibilityRole="header"
      style={styles.prompt}>
      what’s on your mind?
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  prompt: {
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.9,
    fontWeight: '300',
    textAlign: 'center',
  },
});
