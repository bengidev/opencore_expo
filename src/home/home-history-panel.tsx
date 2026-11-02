import { useEffect } from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Scrim, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * The history panel, drawn into the screen it belongs to.
 *
 * It is deliberately not a `Modal`. On Android a modal is its own window: the
 * dialogue takes focus from the activity, and giving it back is what re-shows
 * the keyboard and stops the IME inset from reaching the app again — the
 * composer is left sitting under the keyboard for the rest of the session.
 * Painting over the screen instead keeps one window and one insets stream, so
 * opening history cannot touch how the composer rides the keyboard.
 */
export function HomeHistoryPanel({ onClose }: { onClose: () => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });

    return () => subscription.remove();
  }, [onClose]);

  return (
    <Animated.View
      entering={FadeIn.duration(120)}
      style={[StyleSheet.absoluteFill, styles.layer]}
      accessibilityViewIsModal>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close history"
      />
      <View
        style={[
          styles.card,
          {
            top: insets.top + 48,
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}>
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: {
    zIndex: 2,
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
