import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { Fonts, ThemeColor, type FontRole } from '@/constants/theme';
import { Typography, type TypographyVariant, variantFace } from '@/constants/typography';
import { useAppFonts } from '@/hooks/use-app-fonts';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextType =
  | 'default'
  | 'title'
  | 'small'
  | 'smallBold'
  | 'subtitle'
  | 'link'
  | 'linkPrimary'
  | 'code';

export type ThemedTextProps = TextProps & {
  type?: ThemedTextType;
  variant?: TypographyVariant;
  themeColor?: ThemeColor;
  face?: FontRole;
};

/** Legacy `type` styles — kept for backward-compatible call sites. */
const legacyTypeStyles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  title: {
    fontSize: 48,
    fontWeight: '400',
    lineHeight: 52,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  subtitle: {
    fontSize: 32,
    lineHeight: 44,
    fontWeight: '400',
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
    fontWeight: '400',
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 14,
    fontWeight: '400',
  },
  code: {
    fontWeight: '400',
    fontSize: 12,
  },
});

function legacyFaceFor(type: ThemedTextType): FontRole {
  if (type === 'code') {
    return 'mono';
  }
  if (type === 'link' || type === 'linkPrimary') {
    return 'sans';
  }
  return 'sansMedium';
}

export function ThemedText({
  style,
  type = 'default',
  variant,
  themeColor,
  face,
  ...rest
}: ThemedTextProps) {
  const theme = useTheme();
  const [loaded, error] = useAppFonts();
  const facesReady = loaded && error == null;
  const usesVariant = variant != null;
  const color = theme[themeColor ?? (type === 'linkPrimary' ? 'interactive' : 'text')];

  let metricStyle: TextStyle;
  let resolvedFace: FontRole;

  if (usesVariant) {
    metricStyle = Typography[variant];
    resolvedFace = face ?? variantFace(variant);
  } else {
    metricStyle = legacyTypeStyles[type];
    resolvedFace = face ?? legacyFaceFor(type);
  }

  return (
    <Text
      style={[
        { color },
        metricStyle,
        facesReady && { fontFamily: Fonts[resolvedFace] },
        style,
      ]}
      {...rest}
    />
  );
}
