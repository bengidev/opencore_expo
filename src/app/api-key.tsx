import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  cubicBezier,
  FadeIn,
  useReducedMotion,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KeyboardDismissSurface } from '@/components/keyboard-dismiss-surface';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { useFontFamily } from '@/hooks/use-font-family';
import { useKeyboardBottomPadding } from '@/hooks/use-keyboard-bottom-padding';
import { useTheme } from '@/hooks/use-theme';
import {
  clearOverrideKey,
  saveOverrideKey,
  useKeyStatus,
} from '@/super-chat/llm/credentials-runtime';
import { normalizeKey } from '@/super-chat/llm/credentials';
import { openRouterProvider } from '@/super-chat/llm/providers/openrouter';
import type { KeyStatus } from '@/super-chat/llm/types';

const PRESS_EASE = cubicBezier(0.23, 1, 0.32, 1);
const PRESS_MS = 150;
const PRESS_SCALE = 0.97;
const STATUS_FADE_MS = 150;
/** Long enough to read the saved-anyway line before the sheet closes. */
const UNVERIFIED_CLOSE_MS = 900;
const KEY_PREFIX = 'sk-or-';
const VERSIONED_KEY_PREFIX = 'sk-or-v1-';

type EditorStatus =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'valid' }
  | { kind: 'invalid'; message: string }
  | { kind: 'unknown' }
  | { kind: 'saved-unverified' };

function statusText(status: EditorStatus): string {
  switch (status.kind) {
    case 'idle':
      return 'Idle';
    case 'checking':
      return 'Checking…';
    case 'valid':
      return 'Valid';
    case 'invalid':
      return `Invalid: ${status.message}`;
    case 'unknown':
      return "Couldn't verify";
    case 'saved-unverified':
      return "Couldn't verify — saved anyway.";
  }
}

function statusColor(status: EditorStatus): ThemeColor {
  switch (status.kind) {
    case 'valid':
      return 'success';
    case 'invalid':
      return 'error';
    case 'unknown':
    case 'saved-unverified':
      return 'warning';
    case 'checking':
      return 'textSecondary';
    case 'idle':
      return 'textDisabled';
  }
}

export default function ApiKeyScreen() {
  const theme = useTheme();
  const mono = useFontFamily('mono');
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const keyboardPadding = useKeyboardBottomPadding(
    Math.max(insets.bottom, Spacing.three),
    Spacing.three,
  );
  const keyStatus = useKeyStatus();
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<EditorStatus>({ kind: 'idle' });
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (closeTimer.current !== null) {
        clearTimeout(closeTimer.current);
      }
    };
  }, []);

  const busy = status.kind === 'checking' || status.kind === 'saved-unverified';
  const normalizedDraft = normalizeKey(draft);
  const storedKey = keyStatus?.source === 'override' ? keyStatus.key : null;
  const unchanged = storedKey !== null && normalizedDraft === storedKey;
  const canSave = normalizedDraft !== null && !unchanged && !busy;
  const showDefaultKey = keyStatus?.source === 'override';

  const handleChange = useCallback((value: string) => {
    setDraft(value);
    // An old verdict belongs to the old draft; do not let it label this one.
    setStatus((current) => (current.kind === 'idle' ? current : { kind: 'idle' }));
  }, []);

  const handleSave = useCallback(async () => {
    const value = normalizeKey(draft);
    if (value === null || busy) return;

    if (value.startsWith(KEY_PREFIX) && !value.startsWith(VERSIONED_KEY_PREFIX)) {
      setStatus({ kind: 'invalid', message: `keys start with ${VERSIONED_KEY_PREFIX}` });
      return;
    }

    setStatus({ kind: 'checking' });

    let check: KeyStatus;
    try {
      check = await openRouterProvider.checkKey(value, { fetch });
    } catch {
      check = { state: 'unknown', message: "Couldn't verify this key." };
    }

    // The sheet can be swiped away while the check is in flight; a dismissed
    // editor must not persist its draft or pop another screen.
    if (!mountedRef.current) return;

    if (check.state === 'invalid') {
      setStatus({ kind: 'invalid', message: check.message });
      return;
    }

    if (check.state === 'unknown') {
      setStatus({ kind: 'unknown' });
    }

    try {
      await saveOverrideKey(value);
    } catch {
      setStatus({ kind: 'invalid', message: "Couldn't save this key." });
      return;
    }

    if (!mountedRef.current) return;

    if (check.state === 'valid') {
      setStatus({ kind: 'valid' });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.back();
      return;
    }

    setStatus({ kind: 'saved-unverified' });
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null;
      router.back();
    }, UNVERIFIED_CLOSE_MS);
  }, [busy, draft]);

  const handleUseDefault = useCallback(async () => {
    if (busy) return;

    try {
      await clearOverrideKey();
    } catch {
      setStatus({ kind: 'invalid', message: "Couldn't clear this key." });
      return;
    }

    if (!mountedRef.current) return;

    void Haptics.selectionAsync().catch(() => {});
    router.back();
  }, [busy]);

  return (
    <ThemedView style={styles.screen}>
      <KeyboardDismissSurface>
        <Animated.View style={[styles.fill, keyboardPadding]}>
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}>
            <View style={styles.column}>
              <ThemedText variant="bodySm" themeColor="textSecondary">
                Used for this device only. Stored in the system keychain.
              </ThemedText>

              <View
                style={[
                  styles.field,
                  { backgroundColor: theme.surfaceRaised, borderColor: theme.borderVisible },
                ]}>
                <TextInput
                  value={draft}
                  onChangeText={handleChange}
                  editable={!busy}
                  placeholder="sk-or-v1-…"
                  placeholderTextColor={theme.textDisabled}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                  accessibilityLabel="OpenRouter API key"
                  style={[
                    styles.input,
                    Typography.bodySm,
                    { color: theme.text, fontFamily: mono },
                  ]}
                />
              </View>

              <Animated.View
                key={statusText(status)}
                entering={reducedMotion ? undefined : FadeIn.duration(STATUS_FADE_MS)}
                accessibilityLiveRegion="polite"
                style={styles.status}>
                <ThemedText variant="bodySm" themeColor={statusColor(status)}>
                  {statusText(status)}
                </ThemedText>
              </Animated.View>

              <View style={styles.actions}>
                <PrimaryButton label="Save key" disabled={!canSave} onPress={handleSave} />
                {showDefaultKey ? (
                  <SecondaryButton
                    label="Use default key"
                    disabled={busy}
                    onPress={handleUseDefault}
                  />
                ) : null}
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardDismissSurface>
    </ThemedView>
  );
}

function PrimaryButton({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const isPressed = pressed && !disabled;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        if (!disabled) setPressed(true);
      }}
      onPressOut={() => setPressed(false)}
      pressRetentionOffset={{ top: 12, left: 12, right: 12, bottom: 12 }}>
      <Animated.View
        style={[
          styles.primary,
          { backgroundColor: disabled ? theme.surfaceRaised : theme.textDisplay },
          reducedMotion
            ? {
                transitionProperty: 'opacity',
                transitionDuration: PRESS_MS,
                transitionTimingFunction: PRESS_EASE,
                opacity: isPressed ? 0.65 : 1,
              }
            : {
                transitionProperty: 'transform',
                transitionDuration: PRESS_MS,
                transitionTimingFunction: PRESS_EASE,
                transform: [{ scale: isPressed ? PRESS_SCALE : 1 }],
              },
        ]}>
        <ThemedText variant="controlLabel" themeColor={disabled ? 'textDisabled' : 'background'}>
          {label}
        </ThemedText>
      </Animated.View>
    </Pressable>
  );
}

function SecondaryButton({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const isPressed = pressed && !disabled;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        if (!disabled) setPressed(true);
      }}
      onPressOut={() => setPressed(false)}
      pressRetentionOffset={{ top: 12, left: 12, right: 12, bottom: 12 }}>
      <Animated.View
        style={[
          styles.secondary,
          { borderColor: theme.borderVisible },
          reducedMotion
            ? {
                transitionProperty: 'opacity',
                transitionDuration: PRESS_MS,
                transitionTimingFunction: PRESS_EASE,
                opacity: isPressed ? 0.65 : 1,
              }
            : {
                transitionProperty: 'transform',
                transitionDuration: PRESS_MS,
                transitionTimingFunction: PRESS_EASE,
                transform: [{ scale: isPressed ? PRESS_SCALE : 1 }],
              },
        ]}>
        <ThemedText variant="controlLabel" themeColor="textSecondary">
          {label}
        </ThemedText>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.four,
    alignItems: 'center',
  },
  column: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
  },
  field: {
    minHeight: 56,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: Radius.card,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
  },
  input: {
    paddingVertical: Spacing.two,
  },
  status: {
    minHeight: 21,
  },
  actions: {
    gap: Spacing.two,
  },
  primary: {
    minHeight: 52,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  secondary: {
    minHeight: 52,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
});
