import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { cubicBezier, useReducedMotion } from 'react-native-reanimated';

import { AppIcon } from '@/components/app-icon';
import { NativeSurface } from '@/components/native-surface';
import { TabScreen } from '@/components/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { useFontFamily } from '@/hooks/use-font-family';
import { useTheme } from '@/hooks/use-theme';

const PRESS_EASE = cubicBezier(0.23, 1, 0.32, 1);

/**
 * Conversation history lives on the Chats tab, which is where a native app's
 * tab bar puts it. Nothing is persisted yet, so the screen stays honest about
 * what it can show instead of inventing rows.
 */
export function ChatsScreen() {
  const theme = useTheme();

  return (
    <TabScreen eyebrow="OpenCore" title="Chats">
      <NativeSurface tone="glass" radius={Radius.card} style={styles.card}>
        <View style={styles.cardHeader}>
          <AppIcon
            ios="bubble.left.and.bubble.right"
            android="forum"
            size={13}
            color={theme.textSecondary}
          />
          <ThemedText variant="caption" themeColor="textSecondary">
            On this device
          </ThemedText>
        </View>
        <ThemedText variant="subheading" themeColor="text">
          No saved conversations
        </ThemedText>
        <ThemedText variant="bodySm" themeColor="textSecondary">
          Chats will be listed here once conversation history is stored on the device.
        </ThemedText>
        <NewChatButton />
      </NativeSurface>
    </TabScreen>
  );
}

function NewChatButton() {
  const theme = useTheme();
  const mono = useFontFamily('mono');
  const reducedMotion = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const labelStyle = [Typography.controlLabel, mono ? { fontFamily: mono } : null];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Start a new chat"
      onPress={() => router.push('/super-chat')}
      onPressIn={() => {
        setPressed(true);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }}
      onPressOut={() => setPressed(false)}
      pressRetentionOffset={{ top: 12, left: 12, right: 12, bottom: 12 }}
      style={styles.buttonAnchor}>
      <Animated.View
        style={[
          styles.button,
          { backgroundColor: theme.textDisplay },
          reducedMotion
            ? {
                transitionProperty: 'opacity',
                transitionDuration: 140,
                transitionTimingFunction: PRESS_EASE,
                opacity: pressed ? 0.65 : 1,
              }
            : {
                transitionProperty: 'transform',
                transitionDuration: 140,
                transitionTimingFunction: PRESS_EASE,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
        ]}>
        <Text style={[labelStyle, { color: theme.background }]}>NEW CHAT →</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
    padding: Spacing.four,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  buttonAnchor: {
    alignSelf: 'flex-start',
    marginTop: Spacing.two,
  },
  button: {
    minHeight: 44,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two + Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
