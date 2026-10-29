import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Scrim, Spacing } from '@/constants/theme';
import { useFontFamily } from '@/hooks/use-font-family';
import { useTheme } from '@/hooks/use-theme';

export function HomeHistoryPill() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const sans = useFontFamily('sansMedium');
  const [open, setOpen] = useState(false);

  function handlePress() {
    void Haptics.selectionAsync().catch(() => {});
    setOpen(true);
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="History"
        onPress={handlePress}
        hitSlop={8}
        style={({ pressed }) => [
          styles.pill,
          { backgroundColor: theme.surface, borderColor: theme.border },
          pressed && { opacity: 0.6 },
        ]}>
        <View style={styles.row}>
          <AppIcon ios="clock" android="history" size={12} color={theme.textSecondary} />
          <Text
            style={[
              styles.label,
              sans ? { fontFamily: sans } : null,
              { color: theme.textSecondary },
            ]}>
            History
          </Text>
          <AppIcon
            ios="chevron.down"
            android="keyboard-arrow-down"
            size={10}
            color={theme.textSecondary}
          />
        </View>
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}>
        <Pressable
          style={styles.backdrop}
          onPress={() => setOpen(false)}
          accessibilityLabel="Close history">
          <View
            style={[
              styles.card,
              {
                top: insets.top + 48,
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
            accessibilityViewIsModal>
            <View style={styles.cardHead}>
              <AppIcon ios="clock" android="history" size={13} color={theme.textSecondary} />
              <ThemedText variant="caption" themeColor="textSecondary">
                RECENT
              </ThemedText>
            </View>
            <ThemedText variant="body" themeColor="text">
              No conversations yet
            </ThemedText>
            <ThemedText variant="bodySm" themeColor="textSecondary">
              Start a chat and it will show up here.
            </ThemedText>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: 28,
    borderRadius: Radius.pill,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  label: {
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: -0.1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: Scrim.modal,
  },
  card: {
    position: 'absolute',
    alignSelf: 'center',
    width: 260,
    borderRadius: Radius.card,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.one,
  },
});
