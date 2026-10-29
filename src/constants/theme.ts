import { NothingStatus, NothingTokens } from '@/constants/palette';

/**
 * Semantic colour map. Every value comes from `@/constants/palette`, so this is
 * the only vocabulary components need: `background` is the page, `surface` is a
 * card, `text*` ranks the ink, and the status tokens are shared across modes.
 */
export const Colors = {
  light: {
    background: NothingTokens.light.canvas,
    surface: NothingTokens.light.surface,
    surfaceRaised: NothingTokens.light.surfaceRaised,
    border: NothingTokens.light.border,
    borderVisible: NothingTokens.light.borderVisible,
    textDisabled: NothingTokens.light.textDisabled,
    textSecondary: NothingTokens.light.textSecondary,
    text: NothingTokens.light.text,
    textDisplay: NothingTokens.light.textDisplay,
    interactive: NothingTokens.light.interactive,
    ...NothingStatus,
  },
  dark: {
    background: NothingTokens.dark.canvas,
    surface: NothingTokens.dark.surface,
    surfaceRaised: NothingTokens.dark.surfaceRaised,
    border: NothingTokens.dark.border,
    borderVisible: NothingTokens.dark.borderVisible,
    textDisabled: NothingTokens.dark.textDisabled,
    textSecondary: NothingTokens.dark.textSecondary,
    text: NothingTokens.dark.text,
    textDisplay: NothingTokens.dark.textDisplay,
    interactive: NothingTokens.dark.interactive,
    ...NothingStatus,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** Nothing design stack: Doto (display), Space Grotesk (UI), Space Mono (labels/data). */
export const Fonts = {
  display: 'Doto_400Regular',
  sansLight: 'SpaceGrotesk_300Light',
  sans: 'SpaceGrotesk_400Regular',
  sansMedium: 'SpaceGrotesk_500Medium',
  sansBold: 'SpaceGrotesk_700Bold',
  mono: 'SpaceMono_400Regular',
  monoBold: 'SpaceMono_700Bold',
} as const;

export type FontRole = keyof typeof Fonts;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/**
 * Corner radii, in points.
 *
 * `surface` follows Apple's display corner standard: iPhone-class hardware
 * reports a ~38.5pt display corner radius (roughly 5.5 mm), and iOS renders
 * those corners as continuous curves rather than circular arcs. Surfaces that
 * use it pair it with `borderCurve: 'continuous'`.
 *
 * Everything else follows the Nothing stack: large content sheets at `sheet`,
 * cards and popovers at `card`, small controls at `compact`, and pills at `pill`.
 */
export const Radius = {
  surface: 38,
  sheet: 24,
  card: 16,
  compact: 8,
  technical: 4,
  pill: 999,
} as const;

/** Dimmed backdrop painted behind modal surfaces. */
export const Scrim = {
  modal: 'rgba(0, 0, 0, 0.8)',
} as const;
/** Soft lift for the hero speech bubble. UI chrome separates with a border instead. */
export const BoxShadow = {
  card: '0 2px 10px rgba(0, 0, 0, 0.08)',
  cardDark: '0 4px 14px rgba(0, 0, 0, 0.5)',
} as const;

export const MaxContentWidth = 800;

export type AppColorScheme = 'light' | 'dark';

export type AppMetalFxPreset = 'chromatic' | 'silver' | 'gold';

export type AppMetalFxOptions = {
  preset: AppMetalFxPreset;
  strength: number;
  theme: AppColorScheme;
  innerShadow: boolean;
  tilt: boolean;
};

export function getAppMetalFxOptions(scheme: AppColorScheme): AppMetalFxOptions {
  return {
    preset: 'chromatic',
    strength: 1,
    theme: scheme,
    innerShadow: true,
    tilt: true,
  };
}

export type AppBorderBeamColorVariant = 'colorful' | 'mono' | 'ocean' | 'sunset';

export type AppBorderBeamOptions = {
  colorVariant: AppBorderBeamColorVariant;
  strength: number;
  theme: AppColorScheme;
  staticColors?: boolean;
  hueRange?: number;
  saturation?: number;
  brightness?: number;
};

/**
 * Border beam defaults. The beam is the single colour event on a surface, so it
 * borrows the accent's warm family (`sunset`) instead of the multi-hue rainbow,
 * and the rotation is kept narrow enough to stay inside that family.
 */
export function getAppBorderBeamOptions(scheme: AppColorScheme): AppBorderBeamOptions {
  const onLightSurface = scheme === 'light';

  return {
    colorVariant: 'sunset',
    strength: 1,
    theme: scheme,
    hueRange: onLightSurface ? 14 : 12,
    saturation: onLightSurface ? 1.15 : 1.1,
    brightness: 1,
  };
}

/** Hue rotation (deg) for mono beam tinting from brand accent on web. */
export function getAppBorderBeamAccentHue(colors: (typeof Colors)[AppColorScheme]): number {
  const hex = colors.accent.replace('#', '');
  const r = Number.parseInt(hex.slice(0, 2), 16) / 255;
  const g = Number.parseInt(hex.slice(2, 4), 16) / 255;
  const b = Number.parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return 0;
  let hue = 0;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  return Math.round(hue * 60);
}
