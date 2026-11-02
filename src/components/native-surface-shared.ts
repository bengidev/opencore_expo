import type { ReactNode } from 'react';
import type { ViewProps, ViewStyle } from 'react-native';

import type { Colors } from '@/constants/theme';
import type { UiTier } from '@/lib/ui-tier';

/**
 * What the surface is for, not how it should look.
 *
 * - `glass`: floating chrome that sits over content (the composer, a control).
 * - `raised`: a container that groups content (a card, a sheet).
 * - `plain`: a flat surface with no container at all.
 */
export type NativeSurfaceTone = 'glass' | 'raised' | 'plain';

export type NativeSurfaceProps = ViewProps & {
  tone?: NativeSurfaceTone;
  /** Corner radius for the glass and custom tiers. */
  radius?: number;
  /**
   * Corner radius for the Material tier. Material 3 calls for its own shape
   * scale, and its extra-large container is rounder than the app's sheet.
   */
  materialRadius?: number;
  /** Liquid Glass answers to touches only when the surface is interactive. */
  interactive?: boolean;
  /** `regular` adapts to the content behind it, `clear` stays more transparent. */
  glassEffectStyle?: 'clear' | 'regular';
  tintColor?: string;
  /** Leave the surface unpainted — the content behind it shows through. */
  transparent?: boolean;
  children?: ReactNode;
};

/** The palette for one scheme, widened so light and dark are interchangeable. */
export type NativeSurfaceTheme = { [Key in keyof (typeof Colors)['light']]: string };

/**
 * The paint for every tier that is not Liquid Glass.
 *
 * Material 3 separates containers by tone, not by stroke, so the large floating
 * container sits above the canvas and the controls it hosts sit one step
 * further up — the two tones have to differ or a control disappears into the
 * container it is drawn on. The custom tier has no system tone to lean on, so
 * its one-pixel border is what defines a surface.
 */
export function resolveNativeFill(
  tier: UiTier,
  tone: NativeSurfaceTone,
  transparent: boolean,
  theme: NativeSurfaceTheme,
): ViewStyle {
  switch (tier) {
    case 'android-material':
      return { backgroundColor: tone === 'glass' ? theme.surface : theme.surfaceRaised };
    case 'ios-glass':
      return transparent
        ? { backgroundColor: 'transparent' }
        : { backgroundColor: theme.surface };
    default:
      return transparent
        ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'transparent' }
        : { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border };
  }
}
