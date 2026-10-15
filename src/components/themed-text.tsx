import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useAppFonts } from '@/hooks/use-app-fonts';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
  face?: 'sans' | 'sansMedium' | 'mono';
};

function faceFor(type: NonNullable<ThemedTextProps['type']>): NonNullable<ThemedTextProps['face']> {
  if (type === 'code') {
    return 'mono';
  }
  if (type === 'link' || type === 'linkPrimary') {
    return 'sans';
  }
  return 'sansMedium';
}

export function ThemedText({ style, type = 'default', themeColor, face, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const [loaded, error] = useAppFonts();
  const facesReady = loaded && error == null;
  const color = theme[themeColor ?? (type === 'linkPrimary' ? 'interactive' : 'text')];
  const resolvedFace = face ?? faceFor(type);

  return (
    <Text
      style={[
        { color },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.link,
        type === 'code' && styles.code,
        facesReady && { fontFamily: Fonts[resolvedFace] },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 400,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 400,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 400,
  },
  title: {
    fontSize: 48,
    fontWeight: 400,
    lineHeight: 52,
  },
  subtitle: {
    fontSize: 32,
    lineHeight: 44,
    fontWeight: 400,
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
    fontWeight: 400,
  },
  code: {
    fontWeight: 400,
    fontSize: 12,
  },
});
