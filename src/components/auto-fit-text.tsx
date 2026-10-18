import { useCallback, useState } from 'react';
import type { TextLayoutEvent } from 'react-native';

import { ThemedText, type ThemedTextProps } from '@/components/themed-text';
import type { FontRole, ThemeColor } from '@/constants/theme';
import { Typography, type TypographyVariant } from '@/constants/typography';

type AutoFitTextProps = {
  children: string;
  maxWidth: number;
  maxHeight: number;
  maxFontSize: number;
  minFontSize: number;
  variant?: TypographyVariant;
  face?: FontRole;
  themeColor?: ThemeColor;
  style?: ThemedTextProps['style'];
};

function lineHeightRatio(variant: TypographyVariant): number {
  const token = Typography[variant];
  if (!token.fontSize || !token.lineHeight) {
    return 1.5;
  }
  return token.lineHeight / token.fontSize;
}

export function AutoFitText({
  children,
  maxWidth,
  maxHeight,
  maxFontSize,
  minFontSize,
  variant = 'bodySm',
  face = 'sans',
  themeColor = 'text',
  style,
}: AutoFitTextProps) {
  const contentKey = `${children}|${maxFontSize}|${maxWidth}|${maxHeight}`;
  const [fitState, setFitState] = useState({ key: contentKey, fontSize: maxFontSize });
  if (fitState.key !== contentKey) {
    setFitState({ key: contentKey, fontSize: maxFontSize });
  }
  const fontSize = fitState.key === contentKey ? fitState.fontSize : maxFontSize;
  const ratio = lineHeightRatio(variant);

  const onTextLayout = useCallback(
    (event: TextLayoutEvent) => {
      const lines = event.nativeEvent.lines;
      if (lines.length === 0) {
        return;
      }

      const lastLine = lines[lines.length - 1];
      const totalHeight = lastLine.y + lastLine.height;
      const widthOverflow = lines.some((line) => line.width > maxWidth + 0.5);
      const heightOverflow = totalHeight > maxHeight + 0.5;

      if ((widthOverflow || heightOverflow) && fontSize > minFontSize) {
        setFitState((current) => ({
          key: contentKey,
          fontSize: Math.max(minFontSize, current.fontSize - 0.5),
        }));
      }
    },
    [contentKey, fontSize, maxHeight, maxWidth, minFontSize],
  );

  const letterSpacing =
    variant === 'bodySm' ? (fontSize / Typography.bodySm.fontSize!) * (Typography.bodySm.letterSpacing ?? 0) : undefined;

  return (
    <ThemedText
      variant={variant}
      face={face}
      themeColor={themeColor}
      onTextLayout={onTextLayout}
      style={[
        {
          width: maxWidth,
          fontSize,
          lineHeight: fontSize * ratio,
          letterSpacing,
        },
        style,
      ]}>
      {children}
    </ThemedText>
  );
}
