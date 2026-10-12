import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export function OnboardingSpeech() {
  const theme = useTheme();

  return (
    <View style={[styles.bubble, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <ThemedText face="sans" themeColor="text" style={styles.label}>
        Hello!
      </ThemedText>
      <View style={[styles.tailBorder, { borderTopColor: theme.border }]} />
      <View style={[styles.tailFill, { borderTopColor: theme.surface }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  label: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 400,
  },
  tailBorder: {
    position: 'absolute',
    bottom: -9,
    left: 22,
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderTopWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  tailFill: {
    position: 'absolute',
    bottom: -7,
    left: 24,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
