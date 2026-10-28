import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFontFamily } from '@/hooks/use-font-family';
import { useTheme } from '@/hooks/use-theme';

export function HomeHistoryPill() {
  const theme = useTheme();
  const scheme = useColorScheme();
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
          {
            backgroundColor:
              scheme === 'dark' ? 'rgba(24,24,22,0.72)' : 'rgba(255,255,255,0.64)',
            borderColor:
              scheme === 'dark' ? 'rgba(255,255,255,0.09)' : 'rgba(40,38,30,0.07)',
            boxShadow:
              scheme === 'dark'
                ? '0 4px 16px rgba(0, 0, 0, 0.35)'
                : '0 4px 16px rgba(34, 32, 24, 0.05)',
          },
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
                backgroundColor:
                  scheme === 'dark' ? 'rgba(26,26,24,0.96)' : 'rgba(255,255,255,0.94)',
                borderColor:
                  scheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(40,38,30,0.08)',
                boxShadow:
                  scheme === 'dark'
                    ? '0 18px 44px rgba(0, 0, 0, 0.5)'
                    : '0 18px 44px rgba(40, 37, 27, 0.12)',
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
    borderRadius: 14,
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
  },
  card: {
    position: 'absolute',
    alignSelf: 'center',
    width: 260,
    borderRadius: 18,
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
