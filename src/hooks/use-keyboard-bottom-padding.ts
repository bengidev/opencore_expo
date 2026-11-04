import { useEffect } from 'react';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useGenericKeyboardHandler } from 'react-native-keyboard-controller';

/**
 * Animated bottom padding that follows the keyboard frame by frame.
 *
 * The padding is the current keyboard height plus a base inset, so a
 * bottom-docked surface (a composer, a suggestion row) rides the keyboard on
 * both platforms. Applying it to the screen column instead of a
 * `KeyboardAvoidingView` keeps the offset independent of native navigation
 * headers and lets full-bleed backgrounds (the home ocean) keep their size
 * while the keyboard is open.
 *
 * `restingPadding` is used while the keyboard is closed (usually the bottom
 * safe-area inset). `openPadding` replaces it as the keyboard opens, so the
 * composer keeps a small gap above the keyboard instead of the home-indicator
 * inset.
 *
 * Android has a sibling file that reads the same shape from Reanimated's own
 * keyboard listener; see `use-keyboard-bottom-padding.android.ts` for why the
 * controller's insets callback cannot be trusted there.
 */
export function useKeyboardBottomPadding(
  restingPadding: number,
  openPadding: number,
  // Only the Android tab router needs this; see the sibling file.
  reservedBottom = 0,
) {
  const padding = useSharedValue(restingPadding);
  const keyboardProgress = useSharedValue(0);

  // Handlers only, no resize mode: this file is what iOS and web get, and
  // neither needs the global soft-input mode touched from a screen.
  useGenericKeyboardHandler(
    {
      onMove: (event) => {
        'worklet';

        const progress = Math.min(Math.max(event.progress, 0), 1);
        const base = restingPadding + (openPadding - restingPadding) * progress;

        keyboardProgress.value = progress;
        // iOS reports negative heights while the keyboard is dismissing.
        padding.value = Math.max(event.height, 0) + base;
      },
      onInteractive: (event) => {
        'worklet';

        const progress = Math.min(Math.max(event.progress, 0), 1);
        const base = restingPadding + (openPadding - restingPadding) * progress;

        keyboardProgress.value = progress;
        padding.value = Math.max(event.height, 0) + base;
      },
      onEnd: (event) => {
        'worklet';

        const progress = Math.min(Math.max(event.progress, 0), 1);
        const base = restingPadding + (openPadding - restingPadding) * progress;

        keyboardProgress.value = progress;
        padding.value = Math.max(event.height, 0) + base;
      },
    },
    [restingPadding, openPadding],
  );

  // A tab bar can widen the bottom inset after the first layout pass. Follow
  // that change while the keyboard is closed instead of keeping the padding
  // the screen mounted with until the next keyboard event.
  useEffect(() => {
    if (keyboardProgress.value === 0) {
      padding.value = withTiming(restingPadding, { duration: 180 });
    }
  }, [keyboardProgress, padding, restingPadding]);

  return useAnimatedStyle(() => ({ paddingBottom: padding.value }));
}
