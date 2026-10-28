import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  cubicBezier,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFontFamily } from '@/hooks/use-font-family';
import { useTheme } from '@/hooks/use-theme';
import {
  QUICK_ACTIONS,
  type ComposerActionItem,
} from '@/super-chat/composer/composer-actions';
import { ComposerActionsPopover } from '@/super-chat/composer/composer-actions-popover';
import { normalizeComposerDraft } from '@/super-chat/composer-state';

const TIMING_EASE = Easing.bezier(0.23, 1, 0.32, 1);
const TRANSITION_EASE = cubicBezier(0.23, 1, 0.32, 1);
const FOCUS_MS = 160;
const PRESS_MS = 140;

type HomeComposerProps = {
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: (message: string) => void;
  onNewChat: () => void;
};

export function HomeComposer({ draft, onDraftChange, onSubmit, onNewChat }: HomeComposerProps) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const sans = useFontFamily('sans');
  const mono = useFontFamily('mono');
  const reducedMotion = useReducedMotion() ?? false;
  const [focused, setFocused] = useState(false);
  const focus = useSharedValue(0);
  const enabled = draft.trim().length > 0;

  useEffect(() => {
    focus.set(withTiming(focused ? 1 : 0, { duration: FOCUS_MS, easing: TIMING_EASE }));
  }, [focus, focused]);

  const shellStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focus.get(), [0, 1], [theme.border, theme.borderVisible]),
  }));

  function handleAction(item: ComposerActionItem) {
    switch (item.id) {
      case 'action:clear-input':
        onDraftChange('');
        return;
      case 'action:new-chat':
        onNewChat();
        return;
      default:
        void Haptics.selectionAsync().catch(() => {});
        Alert.alert(item.title, `${item.title} will be available soon.`);
    }
  }

  function handleSend() {
    const message = normalizeComposerDraft(draft);
    if (message === null) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onSubmit(message);
  }

  return (
    <View style={styles.wrap}>
      <Animated.View
        style={[
          styles.shell,
          {
            backgroundColor: scheme === 'dark' ? 'rgba(18,18,17,0.86)' : 'rgba(255,255,255,0.88)',
            boxShadow:
              scheme === 'dark'
                ? '0 10px 30px rgba(0, 0, 0, 0.45)'
                : '0 10px 30px rgba(34, 32, 24, 0.07)',
          },
          shellStyle,
        ]}>
        <ComposerActionsPopover
          items={QUICK_ACTIONS}
          variant="plain"
          onSelect={handleAction}
        />
        <TextInput
          value={draft}
          onChangeText={onDraftChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={handleSend}
          submitBehavior="submit"
          returnKeyType="send"
          enablesReturnKeyAutomatically
          placeholder="Ask me anything"
          placeholderTextColor={theme.textDisabled}
          selectionColor={theme.textSecondary}
          multiline
          style={[
            styles.input,
            sans ? { fontFamily: sans } : null,
            { color: theme.text },
          ]}
          accessibilityLabel="Message"
        />
        {Platform.OS === 'web' ? (
          <ThemedText
            variant="caption"
            themeColor="textDisabled"
            pointerEvents="none"
            style={[styles.hint, mono ? { fontFamily: mono } : null]}>
            ⌘↵ send · ⇧↵ newline
          </ThemedText>
        ) : null}
        <HeroIconButton
          label="Voice input"
          ios="mic.fill"
          android="mic"
          onPress={() => void Haptics.selectionAsync().catch(() => {})}
        />
        <SendButton enabled={enabled} reducedMotion={reducedMotion} onPress={handleSend} />
      </Animated.View>
    </View>
  );
}

function HeroIconButton({
  label,
  ios,
  android,
  onPress,
}: {
  label: string;
  ios: 'mic.fill';
  android: 'mic';
  onPress: () => void;
}) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion() ?? false;
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      hitSlop={6}>
      <Animated.View
        style={[
          styles.iconButton,
          reducedMotion
            ? {
                transitionProperty: 'opacity',
                transitionDuration: PRESS_MS,
                transitionTimingFunction: TRANSITION_EASE,
                opacity: pressed ? 0.6 : 1,
              }
            : {
                transitionProperty: 'transform',
                transitionDuration: PRESS_MS,
                transitionTimingFunction: TRANSITION_EASE,
                transform: [{ scale: pressed ? 0.9 : 1 }],
              },
        ]}>
        <AppIcon ios={ios} android={android} size={19} color={theme.textSecondary} />
      </Animated.View>
    </Pressable>
  );
}

function SendButton({
  enabled,
  reducedMotion,
  onPress,
}: {
  enabled: boolean;
  reducedMotion: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const [pressed, setPressed] = useState(false);
  const progress = useSharedValue(enabled ? 1 : 0);

  useEffect(() => {
    progress.set(withTiming(enabled ? 1 : 0, { duration: 180, easing: TIMING_EASE }));
  }, [enabled, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.get(),
      [0, 1],
      [theme.border, theme.textDisplay],
    ),
  }));

  const iconColor = enabled ? theme.background : theme.textDisabled;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Send message"
      accessibilityState={{ disabled: !enabled }}
      disabled={!enabled}
      onPress={onPress}
      onPressIn={() => {
        if (!enabled) return;
        setPressed(true);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }}
      onPressOut={() => setPressed(false)}
      hitSlop={4}>
      <Animated.View
        style={[
          styles.send,
          fillStyle,
          reducedMotion
            ? {
                transitionProperty: 'opacity',
                transitionDuration: PRESS_MS,
                transitionTimingFunction: TRANSITION_EASE,
                opacity: pressed ? 0.65 : 1,
              }
            : {
                transitionProperty: 'transform',
                transitionDuration: PRESS_MS,
                transitionTimingFunction: TRANSITION_EASE,
                transform: [{ scale: pressed ? 0.94 : 1 }],
              },
        ]}>
        <AppIcon ios="arrow.up" android="arrow-upward" size={17} color={iconColor} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  shell: {
    minHeight: 56,
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacing.two,
    paddingRight: Spacing.one,
    gap: Spacing.one,
  },
  input: {
    flex: 1,
    minHeight: 24,
    maxHeight: 96,
    paddingVertical: 0,
    fontSize: 16,
    lineHeight: 22,
  },
  hint: {
    flexShrink: 0,
    fontSize: 10,
    letterSpacing: 0.2,
    marginRight: Spacing.one,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  send: {
    width: 34,
    height: 34,
    borderRadius: 11,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
