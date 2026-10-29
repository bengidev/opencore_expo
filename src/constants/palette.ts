/**
 * Nothing design system colour tokens.
 *
 * Transcribed 1:1 from `dominikmartn/nothing-design-skill` →
 * `nothing-design/references/tokens.md`. Nothing else in the app holds a colour
 * literal: components read the semantic map in `@/constants/theme`, which is
 * built from this file, and the Skia hero converts these hexes at runtime.
 */

/**
 * Mode-scoped tokens.
 *
 * Light is a printed technical manual (off-white paper, black ink); dark is an
 * instrument panel in a dark room (OLED black, glowing data). The two modes swap
 * the same roles, so a component never branches on the scheme for colour.
 */
export const NothingTokens = {
  light: {
    /** Spec name `--black`. The page, not the ink. */
    canvas: '#F5F5F5',
    /** Elevated surfaces, cards, sheets. */
    surface: '#FFFFFF',
    /** Second elevation: chips, insets, pressed rows. */
    surfaceRaised: '#F0F0F0',
    /** Decorative dividers only. */
    border: '#E8E8E8',
    /** Intentional borders and wireframe lines. */
    borderVisible: '#CCCCCC',
    /** Disabled text and decorative glyphs. */
    textDisabled: '#999999',
    /** Labels, captions, metadata. */
    textSecondary: '#666666',
    /** Body text. */
    text: '#1A1A1A',
    /** Headlines and hero numbers. */
    textDisplay: '#000000',
    /** Tappable text only: links, picker values. Never buttons. */
    interactive: '#007AFF',
  },
  dark: {
    canvas: '#000000',
    surface: '#111111',
    surfaceRaised: '#1A1A1A',
    border: '#222222',
    borderVisible: '#333333',
    textDisabled: '#666666',
    textSecondary: '#999999',
    text: '#E8E8E8',
    textDisplay: '#FFFFFF',
    interactive: '#5B9BF6',
  },
} as const;

/**
 * Identical in both modes. The accent is the single colour event on a screen:
 * active state, destructive action, urgent signal. Never decorative.
 */
export const NothingStatus = {
  accent: '#D71921',
  /** Accent tint background, for the one filled-accent case per screen. */
  accentSubtle: 'rgba(215, 25, 33, 0.15)',
  success: '#4A9E5C',
  warning: '#D4A843',
  /** Errors are the accent moment, so `error` shares the accent red. */
  error: '#D71921',
  /** Info borrows secondary ink rather than inventing another blue. */
  info: '#999999',
} as const;

export type NothingMode = keyof typeof NothingTokens;

/** A token that changes with the colour scheme. */
export type NothingModeToken = keyof (typeof NothingTokens)[NothingMode];

/** A status token whose value is the same in both modes. */
export type NothingStatusToken = keyof typeof NothingStatus;

/**
 * Resolve a palette hex into the 0–255 triple Skia paint calls expect, so the
 * hero art draws in palette ink instead of hand-copied RGB.
 */
export function hexToRgb255(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}
