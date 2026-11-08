import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
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
import { isValidKeyFormat, normalizeKey } from '@/super-chat/llm/credentials';
import { openRouterProvider } from '@/super-chat/llm/providers/openrouter';
import type { KeyStatus } from '@/super-chat/llm/types';

const PRESS_EASE = cubicBezier(0.23, 1, 0.32, 1);
const PRESS_MS = 150;
const PRESS_SCALE = 0.97;
const STATUS_FADE_MS = 150;
/** Long enough to read the saved-anyway line before the sheet closes. */
const UNVERIFIED_CLOSE_MS = 900;
/** A hung request must not pin the editor on `Checking…`. */
const CHECK_TIMEOUT_MS = 10_000;

type EditorStatus =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'valid' }
  | { kind: 'invalid'; message: string }
  | { kind: 'unknown' }
  | { kind: 'saved-unverified' }
  | { kind: 'storage-error'; message: string };

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
    case 'storage-error':
      return status.message;
  }
}

function statusColor(status: EditorStatus): ThemeColor {
  switch (status.kind) {
    case 'valid':
      return 'success';
    case 'invalid':
    case 'storage-error':
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
  const [submitting, setSubmitting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkController = useRef<AbortController | null>(null);
  const saveInFlight = useRef(false);
  const clearInFlight = useRef(false);
  const mountedRef = useRef(true);

  /** The unverified-save timer must not close the sheet while the user edits. */
  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (closeTimer.current !== null) {
        clearTimeout(closeTimer.current);
      }
      if (checkTimer.current !== null) {
        clearTimeout(checkTimer.current);
      }
      checkController.current?.abort();
    };
  }, []);

  // VoiceOver and TalkBack only read the status line on Android, and only when
  // it is a live region; announcing the verdict explicitly covers both.
  useEffect(() => {
    if (
      status.kind === 'invalid' ||
      status.kind === 'unknown' ||
      status.kind === 'saved-unverified' ||
      status.kind === 'storage-error'
    ) {
      AccessibilityInfo.announceForAccessibility(statusText(status));
    }
  }, [status]);

  const busy =
    status.kind === 'checking' || status.kind === 'saved-unverified' || submitting || clearing;
  const normalizedDraft = normalizeKey(draft);
  const storedKey = keyStatus?.source === 'override' ? keyStatus.key : null;
  const unchanged = storedKey !== null && normalizedDraft === storedKey;
  const canSave = normalizedDraft !== null && !unchanged && !busy;
  const showDefaultKey = keyStatus?.source === 'override';

  const handleChange = useCallback((value: string) => {
    clearCloseTimer();
    setDraft(value);
    // An old verdict belongs to the old draft; do not let it label this one.
    setStatus((current) => (current.kind === 'idle' ? current : { kind: 'idle' }));
  }, [clearCloseTimer]);

  const handleSave = useCallback(async () => {
    clearCloseTimer();
    // The state update lands a render later, so a second tap in the same frame
    // would still see `busy === false`; the ref closes that window.
    if (saveInFlight.current) return;

    const value = normalizeKey(draft);
    if (value === null || busy) return;

    if (!isValidKeyFormat(value)) {
      setStatus({ kind: 'invalid', message: 'keys start with sk-or-v1-' });
      return;
    }

    saveInFlight.current = true;
    setSubmitting(true);
    setStatus({ kind: 'checking' });

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
      checkController.current = controller;
      checkTimer.current = timeout;

      let check: KeyStatus;
      try {
        // The provider maps a failure or an abort to `unknown`, so a hung
        // request ends as "couldn't verify" rather than a rejection.
        check = await openRouterProvider.checkKey(value, {
          fetch: (input, init) => fetch(input, { ...init, signal: controller.signal }),
        });
      } finally {
        clearTimeout(timeout);
        checkTimer.current = null;
        checkController.current = null;
      }

      // The sheet can be swiped away while the check is in flight; a dismissed
      // editor must not persist its draft or pop another screen.
      if (!mountedRef.current) return;

      if (check.state === 'invalid') {
        setStatus({ kind: 'invalid', message: check.message });
        return;
      }

      try {
        await saveOverrideKey(value);
      } catch {
        // A keychain write failure is not a bad key: do not frame it as one.
        setStatus({ kind: 'storage-error', message: "Couldn't save this key." });
        return;
      }

      if (!mountedRef.current) return;

      if (check.state === 'valid') {
        setStatus({ kind: 'valid' });
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        router.back();
        return;
      }

      // One final state for the unverified path: flipping through `unknown` on
      // the way here remounted the keyed fade twice for no information gain.
      setStatus({ kind: 'saved-unverified' });
      closeTimer.current = setTimeout(() => {
        closeTimer.current = null;
        router.back();
      }, UNVERIFIED_CLOSE_MS);
    } finally {
      saveInFlight.current = false;
      setSubmitting(false);
    }
  }, [busy, clearCloseTimer, draft]);

  const handleUseDefault = useCallback(async () => {
    clearCloseTimer();
    if (clearInFlight.current || busy) return;

    clearInFlight.current = true;
    setClearing(true);

    try {
      await clearOverrideKey();
    } catch {
      // Deleting from the keychain can fail too; that is a storage problem,
      // not an `Invalid:` verdict on a key the user just typed.
      setStatus({ kind: 'storage-error', message: "Couldn't clear this key." });
      return;
    } finally {
      clearInFlight.current = false;
      setClearing(false);
    }

    if (!mountedRef.current) return;

    void Haptics.selectionAsync().catch(() => {});
    router.back();
  }, [busy, clearCloseTimer]);

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
              <ThemedText variant="body" themeColor="textSecondary">
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
                  editable={!submitting && !clearing}
                  placeholder="sk-or-v1-…"
                  placeholderTextColor={theme.textDisabled}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                  returnKeyType="done"
                  onSubmitEditing={canSave ? handleSave : undefined}
                  accessibilityLabel="OpenRouter API key"
                  style={[
                    styles.input,
                    Typography.body,
                    { color: theme.text, fontFamily: mono },
                  ]}
                />
              </View>

              <Animated.View
                key={statusText(status)}
                entering={reducedMotion ? undefined : FadeIn.duration(STATUS_FADE_MS)}
                style={styles.status}>
                <ThemedText variant="body" themeColor={statusColor(status)}>
                  {statusText(status)}
                </ThemedText>
              </Animated.View>

              <View style={styles.actions}>
                <ActionButton
                  label="Save key"
                  variant="primary"
                  disabled={!canSave}
                  onPress={handleSave}
                />
                {showDefaultKey ? (
                  <ActionButton
                    label="Use default key"
                    variant="secondary"
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

function ActionButton({
  label,
  variant,
  disabled,
  onPress,
}: {
  label: string;
  variant: 'primary' | 'secondary';
  disabled: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const isPressed = pressed && !disabled;
  const primary = variant === 'primary';

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
          styles.action,
          primary
            ? { backgroundColor: disabled ? theme.surfaceRaised : theme.textDisplay }
            : { borderColor: theme.borderVisible },
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
        <ThemedText
          variant="controlLabel"
          themeColor={primary ? (disabled ? 'textDisabled' : 'background') : 'textSecondary'}>
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
    minHeight: Typography.body.lineHeight,
  },
  actions: {
    gap: Spacing.two,
  },
  action: {
    minHeight: 52,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
});
