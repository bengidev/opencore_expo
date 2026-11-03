import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { dismissKeyboard } from '@/components/keyboard-dismiss-surface';
import { NativeSurface } from '@/components/native-surface';
import { Radius, Spacing } from '@/constants/theme';
import { useFontFamily } from '@/hooks/use-font-family';
import { useTheme } from '@/hooks/use-theme';

/**
 * The history trigger.
 *
 * It is a plain pressable rather than a system menu (`Menu`, `DropdownMenu`,
 * a `UIMenu`): on iOS 26 and later a system menu puts its own hidden text field
 * into focus for type-ahead filtering, and every platform re-shows the keyboard
 * for whichever editor still holds focus when a popup window takes and returns
 * focus. Either way a native menu summons the keyboard on a screen whose
 * composer has nothing to type into, and neither can be dismissed from
 * JavaScript because no TextInput owns that keyboard. The panel it opens is
 * drawn by the app (see `home-history-panel.tsx`). The chip itself is still the
 * platform's own surface through `NativeSurface`: Liquid Glass on iOS 26, the
 * Material container on Android, a bordered capsule elsewhere.
 */
export function HomeHistoryPill({ onOpen }: { onOpen: () => void }) {
  const theme = useTheme();
  const sans = useFontFamily('sansMedium');

  function handlePress() {
    // Blur before the panel opens: a panel presented over a focused editor is
    // what makes the keyboard come back on a tap that never asked for it.
    dismissKeyboard();
    void Haptics.selectionAsync().catch(() => {});
    onOpen();
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="History"
      accessibilityHint="Opens recent conversations"
      onPress={handlePress}
      hitSlop={8}
      style={({ pressed }) => (pressed ? styles.pressed : null)}>
      <NativeSurface tone="glass" radius={Radius.pill} interactive style={styles.pill}>
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
      </NativeSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: 30,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
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
});
