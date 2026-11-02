import type { MaterialColors } from '@expo/ui/jetpack-compose';

import { Colors, type AppColorScheme } from '@/constants/theme';

/**
 * Palette hex to the `#RRGGBBAA` form Material 3 roles are read in.
 *
 * Compose holds the scheme as ARGB, and `@expo/ui` documents overrides in the
 * same shape `getMaterialColors()` returns, so every role leaves this file in
 * eight digits even when it is opaque.
 */
function rgbaHex(hex: string, alpha = 1): `#${string}` {
  const byte = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');

  return `${hex.slice(0, 7)}${byte}`.toUpperCase() as `#${string}`;
}

/**
 * The Material 3 scheme the Android tier draws with, rebuilt from the app
 * palette.
 *
 * Compose takes its defaults from `MaterialTheme.colorScheme`: the sheet's
 * container, the drag handle, the caret, ripples, menu surfaces, the scrim. Left
 * alone that scheme is Material You's, so a device with a lavender wallpaper
 * paints every native Android surface violet while the rest of the app stays
 * off-white. Mapping the roles onto palette tokens keeps Material's own
 * structure — tonal containers, elevation, state layers — and drops only its
 * colour: surfaces step page → sheet → chip, ink ranks text → secondary →
 * disabled, and the accent stays the single colour event.
 */
export function getMaterialColorOverrides(scheme: AppColorScheme): Partial<MaterialColors> {
  const color = Colors[scheme];

  return {
    /** The accent is the one colour event on a screen, never decoration. */
    primary: rgbaHex(color.accent),
    onPrimary: rgbaHex(color.surface),
    primaryContainer: rgbaHex(color.surfaceRaised),
    onPrimaryContainer: rgbaHex(color.text),
    inversePrimary: rgbaHex(color.accent),
    secondary: rgbaHex(color.textSecondary),
    onSecondary: rgbaHex(color.surface),
    secondaryContainer: rgbaHex(color.surfaceRaised),
    onSecondaryContainer: rgbaHex(color.text),
    tertiary: rgbaHex(color.textSecondary),
    onTertiary: rgbaHex(color.surface),
    tertiaryContainer: rgbaHex(color.surfaceRaised),
    onTertiaryContainer: rgbaHex(color.text),

    /** Three tones and nothing between them: canvas, surface, raised surface. */
    background: rgbaHex(color.background),
    onBackground: rgbaHex(color.text),
    surface: rgbaHex(color.surface),
    onSurface: rgbaHex(color.text),
    surfaceVariant: rgbaHex(color.surfaceRaised),
    onSurfaceVariant: rgbaHex(color.textSecondary),
    /**
     * The app separates with borders, not with tinted elevation. A neutral tint
     * keeps a tonal-elevated container from washing the sheet in primary.
     */
    surfaceTint: rgbaHex(color.surface),
    surfaceBright: rgbaHex(color.surface),
    surfaceDim: rgbaHex(color.background),
    surfaceContainerLowest: rgbaHex(color.surface),
    surfaceContainerLow: rgbaHex(color.surface),
    surfaceContainer: rgbaHex(color.surfaceRaised),
    surfaceContainerHigh: rgbaHex(color.surfaceRaised),
    surfaceContainerHighest: rgbaHex(color.border),
    inverseSurface: rgbaHex(color.text),
    inverseOnSurface: rgbaHex(color.surface),

    /** Intentional boundaries are visible; decorative dividers are not. */
    outline: rgbaHex(color.borderVisible),
    outlineVariant: rgbaHex(color.border),

    /** Errors are the accent moment, so they share its red. */
    error: rgbaHex(color.error),
    onError: rgbaHex(color.surface),
    errorContainer: rgbaHex(color.accent, 0.15),
    onErrorContainer: rgbaHex(color.text),

    /** The modal backdrop dims to the palette's own scrim. */
    scrim: rgbaHex('#000000', 0.8),

    /**
     * Fixed roles keep one tone across both modes. Nothing in the palette does,
     * so they follow the same three surfaces as everything else.
     */
    primaryFixed: rgbaHex(color.surfaceRaised),
    primaryFixedDim: rgbaHex(color.border),
    onPrimaryFixed: rgbaHex(color.text),
    onPrimaryFixedVariant: rgbaHex(color.textSecondary),
    secondaryFixed: rgbaHex(color.surfaceRaised),
    secondaryFixedDim: rgbaHex(color.border),
    onSecondaryFixed: rgbaHex(color.text),
    onSecondaryFixedVariant: rgbaHex(color.textSecondary),
    tertiaryFixed: rgbaHex(color.surfaceRaised),
    tertiaryFixedDim: rgbaHex(color.border),
    onTertiaryFixed: rgbaHex(color.text),
    onTertiaryFixedVariant: rgbaHex(color.textSecondary),
  };
}
