import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export function HomeGreeting() {
  return (
    <View style={styles.greetingBlock}>
      <ThemedText variant="heading" themeColor="textSecondary" style={styles.centered}>
        Hello
      </ThemedText>
      <ThemedText variant="heading" themeColor="textDisplay" style={styles.centered}>
        How Can I Help You?
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  greetingBlock: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  centered: {
    textAlign: 'center',
  },
});
