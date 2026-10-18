import type { TextStyle } from 'react-native';

import type { FontRole } from '@/constants/theme';

/**
 * Type scale from Nothing design system (dominikmartn/nothing-design-skill).
 * Hierarchy: display (Doto) → heading/body (Space Grotesk) → label (Space Mono caps).
 */
export type TypographyVariant =
  | 'displayXl'
  | 'displayLg'
  | 'displayMd'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bodySm'
  | 'caption'
  | 'label'
  | 'controlLabel';

export const Typography: Record<TypographyVariant, TextStyle> = {
  displayXl: {
    fontSize: 72,
    lineHeight: 72,
    letterSpacing: -2.16,
  },
  displayLg: {
    fontSize: 48,
    lineHeight: 50.4,
    letterSpacing: -0.96,
  },
  displayMd: {
    fontSize: 36,
    lineHeight: 39.6,
    letterSpacing: -0.72,
  },
  heading: {
    fontSize: 24,
    lineHeight: 28.8,
    letterSpacing: -0.24,
  },
  subheading: {
    fontSize: 18,
    lineHeight: 23.4,
    letterSpacing: 0,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodySm: {
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: 0.14,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16.8,
    letterSpacing: 0.48,
  },
  label: {
    fontSize: 11,
    lineHeight: 13.2,
    letterSpacing: 0.88,
    textTransform: 'uppercase',
  },
  /** Space Mono instrument labels on buttons and compact controls (Nothing components.md). */
  controlLabel: {
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 0.78,
    textTransform: 'uppercase',
  },
};

export function variantFace(variant: TypographyVariant): 'display' | 'sans' | 'mono' {
  if (variant === 'displayXl' || variant === 'displayLg' || variant === 'displayMd') {
    return 'display';
  }
  if (variant === 'label' || variant === 'controlLabel' || variant === 'caption') {
    return 'mono';
  }
  return 'sans';
}

export function resolveTypographyFont(
  variant: TypographyVariant,
  face?: FontRole,
): { role: FontRole } {
  if (face) {
    if (face === 'sansBold') {
      return { role: 'sansMedium' };
    }
    return { role: face };
  }
  if (variant === 'subheading') {
    return { role: 'sansMedium' };
  }
  const mapped = variantFace(variant);
  if (mapped === 'display') {
    return { role: 'display' };
  }
  if (mapped === 'mono') {
    return { role: 'mono' };
  }
  return { role: 'sans' };
}

export const TypographyInput: TextStyle = Typography.body;
