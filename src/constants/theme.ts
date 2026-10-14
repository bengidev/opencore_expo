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

export const Fonts = {
  sans: 'SpaceGrotesk_400Regular',
  sansMedium: 'SpaceGrotesk_500Medium',
  mono: 'SpaceMono_400Regular',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const MaxContentWidth = 800;
