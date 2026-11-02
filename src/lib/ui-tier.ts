import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Platform } from 'react-native';

/**
 * The platform design system this device can render natively.
 *
 * Every surface in the app resolves against a tier before it reaches for a
 * custom treatment, so the order is always: the system's own chrome first, the
 * platform's design language second, and the app's own borders and vendor
 * effects only when neither exists.
 *
 * - `ios-glass`: iOS 26+ where the Liquid Glass APIs are present at runtime.
 *   Chrome is real system glass: glass buttons, glass sheets, glass toolbars.
 * - `android-material`: Android, where the Material 3 pieces come from
 *   `@expo/ui/jetpack-compose` and ship inside the app build. No runtime gate
 *   is needed because those components are part of the binary.
 * - `custom`: everything else — the web, and iOS versions that predate Liquid
 *   Glass — where the app falls back to its own bordered surfaces.
 */
export type UiTier = 'ios-glass' | 'android-material' | 'custom';

function detectUiTier(): UiTier {
  if (Platform.OS === 'ios') {
    return isLiquidGlassAvailable() && isGlassEffectAPIAvailable() ? 'ios-glass' : 'custom';
  }

  if (Platform.OS === 'android') {
    return 'android-material';
  }

  return 'custom';
}

/**
 * Resolved once, because neither the OS version nor the presence of the
 * Liquid Glass API can change while the app is running. Keeping it a module
 * constant lets components branch without a render-time native call.
 */
export const UI_TIER: UiTier = detectUiTier();

export const isIosGlass = UI_TIER === 'ios-glass';

export const isAndroidMaterial = UI_TIER === 'android-material';

/** True when the platform supplies its own chrome and no custom fallback is needed. */
export const hasNativeChrome = UI_TIER !== 'custom';

export function useUiTier(): UiTier {
  return UI_TIER;
}
