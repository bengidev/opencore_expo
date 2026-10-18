export const Colors = {
  light: {
    background: '#F5F5F5',
    surface: '#FFFFFF',
    surfaceRaised: '#F0F0F0',
    border: '#E8E8E8',
    borderVisible: '#CCCCCC',
    textDisabled: '#999999',
    textSecondary: '#666666',
    text: '#1A1A1A',
    textDisplay: '#000000',
    accent: '#D71921',
    interactive: '#007AFF',
  },
  dark: {
    background: '#000000',
    surface: '#111111',
    surfaceRaised: '#1A1A1A',
    border: '#222222',
    borderVisible: '#333333',
    textDisabled: '#666666',
    textSecondary: '#999999',
    text: '#E8E8E8',
    textDisplay: '#FFFFFF',
    accent: '#D71921',
    interactive: '#5B9BF6',
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

/** CSS box-shadow strings (Expo / New Architecture). */
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

/** Border beam defaults — boosted for visibility on app surfaces (esp. light cards). */
export function getAppBorderBeamOptions(scheme: AppColorScheme): AppBorderBeamOptions {
  const onLightSurface = scheme === 'light';

  return {
    colorVariant: 'colorful',
    strength: 1,
    theme: scheme,
    hueRange: onLightSurface ? 52 : 42,
    saturation: onLightSurface ? 2.15 : 1.65,
    brightness: onLightSurface ? 1.6 : 1.4,
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
