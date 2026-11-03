import { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';

/**
 * Animated bottom padding that follows the keyboard frame by frame.
 *
 * Android needs its own source of truth here. The screen runs edge to edge, so
 * `adjustResize` does not shrink the window and the app has to consume the IME
 * inset itself. Listening for that inset through
 * `react-native-keyboard-controller` means depending on the module's insets
 * callback reaching the RN view tree, which it does not do reliably once the
 * navigation bar is translucent — the composer stays put and the keyboard
 * lands on top of it.
 *
 * `useAnimatedKeyboard` attaches its listener to the activity's decor view and
 * reports the height straight to the UI thread, so the padding lands without
 * anything in between. Both translucency flags are set for the same reason
 * they matter to the controller: the height has to be the full IME inset, and
 * unmounting must not turn edge-to-edge back off for the rest of the app.
 *
 * `restingPadding` is used while the keyboard is closed (usually the bottom
 * safe-area inset). `openPadding` replaces it as soon as the keyboard starts
 * rising, so the composer keeps a small gap above the keyboard instead of the
 * home-indicator inset.
 *
 * `reservedBottom` is the part of the window the view does not cover — inside
 * a native tab screen the tab bar sits there, underneath the RN root. The
 * keyboard height is measured from the window edge, so without subtracting it
 * the composer would float a tab bar's height above the keyboard.
 */
export function useKeyboardBottomPadding(
  restingPadding: number,
  openPadding: number,
  reservedBottom = 0,
) {
  const { height } = useAnimatedKeyboard({
    isStatusBarTranslucentAndroid: true,
    isNavigationBarTranslucentAndroid: true,
  });

  return useAnimatedStyle(() => {
    const keyboard = Math.max(height.value - reservedBottom, 0);
    const base = keyboard > 0 ? openPadding : restingPadding;

    return { paddingBottom: keyboard + base };
  });
}
