import { Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor, type FontRole } from '@/constants/theme';
import { Typography, type TypographyVariant, variantFace } from '@/constants/typography';
import { useAppFonts } from '@/hooks/use-app-fonts';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  variant?: TypographyVariant;
  themeColor?: ThemeColor;
  face?: FontRole;
};

const typeToVariant: Record<NonNullable<ThemedTextProps['type']>, TypographyVariant> = {
  default: 'body',
  title: 'displayLg',
  small: 'bodySm',
  smallBold: 'bodySm',
  subtitle: 'displayMd',
  link: 'bodySm',
  linkPrimary: 'bodySm',
  code: 'label',
};

function faceForType(type: NonNullable<ThemedTextProps['type']>): FontRole {
  if (type === 'code') {
    return 'mono';
  }
  return 'sans';
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
  const resolvedVariant = variant ?? typeToVariant[type];
  const color = theme[themeColor ?? (type === 'linkPrimary' ? 'interactive' : 'text')];
  const resolvedFace = face ?? (variant ? variantFace(variant) : faceForType(type));

  return (
    <Text
      style={[
        { color },
        Typography[resolvedVariant],
        facesReady && { fontFamily: Fonts[resolvedFace] },
        style,
      ]}
      {...rest}
    />
  );
}
