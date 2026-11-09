import * as WebBrowser from 'expo-web-browser';
import { memo, useCallback, useMemo } from 'react';
import { Linking, StyleSheet } from 'react-native';
import {
  EnrichedMarkdownText,
  type MarkdownStyle,
} from 'react-native-enriched-markdown';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { normalizeMarkdownHtml } from '@/super-chat/markdown-normalize';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Assistant answers are GFM documents that arrive token by token. The native
 * renderer parses the partial document on every update and keeps block-level
 * constructs (tables, code fences) stable while they are still being written,
 * which the previous line-based JSX reader could not do.
 */
const LINK_SCHEMES = ['https://', 'http://', 'mailto:', 'tel:'];

function isAllowedLink(href: string): boolean {
  return LINK_SCHEMES.some((scheme) => href.startsWith(scheme));
}

const BODY = {
  fontFamily: Fonts.sans,
  fontSize: Typography.body.fontSize,
  lineHeight: Typography.body.lineHeight,
} as const;

type AppColors = {
  background: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  borderVisible: string;
  textSecondary: string;
  text: string;
  textDisplay: string;
  interactive: string;
};

function buildStyle(colors: AppColors): MarkdownStyle {
  return {
    paragraph: {
      ...BODY,
      color: colors.text,
      marginTop: 0,
      marginBottom: Spacing.two,
    },
    h1: {
      fontFamily: Fonts.sansBold,
      fontSize: Typography.heading.fontSize,
      lineHeight: Typography.heading.lineHeight,
      color: colors.textDisplay,
      marginTop: Spacing.three,
      marginBottom: Spacing.two,
    },
    h2: {
      fontFamily: Fonts.sansMedium,
      fontSize: Typography.subheading.fontSize,
      lineHeight: Typography.subheading.lineHeight,
      color: colors.textDisplay,
      marginTop: Spacing.three,
      marginBottom: Spacing.two,
    },
    h3: {
      fontFamily: Fonts.sansMedium,
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
      color: colors.textDisplay,
      marginTop: Spacing.two,
      marginBottom: Spacing.one,
    },
    h4: {
      fontFamily: Fonts.sansMedium,
      fontSize: Typography.bodySm.fontSize,
      lineHeight: Typography.bodySm.lineHeight,
      color: colors.textDisplay,
      marginTop: Spacing.two,
      marginBottom: Spacing.one,
    },
    h5: {
      fontFamily: Fonts.sansMedium,
      fontSize: Typography.bodySm.fontSize,
      lineHeight: Typography.bodySm.lineHeight,
      color: colors.text,
      marginTop: Spacing.two,
      marginBottom: Spacing.one,
    },
    h6: {
      fontFamily: Fonts.mono,
      fontSize: 12,
      lineHeight: 16.8,
      color: colors.textSecondary,
      marginTop: Spacing.two,
      marginBottom: Spacing.one,
    },
    strong: {
      fontFamily: Fonts.sansBold,
      fontWeight: 'normal',
      color: colors.textDisplay,
    },
    em: {
      fontFamily: Fonts.sans,
    },
    link: {
      color: colors.interactive,
      underline: true,
    },
    code: {
      fontFamily: Fonts.mono,
      fontSize: Typography.bodySm.fontSize,
      color: colors.text,
      backgroundColor: colors.surfaceRaised,
      borderColor: colors.border,
    },
    codeBlock: {
      fontFamily: Fonts.mono,
      fontSize: 13,
      lineHeight: Typography.bodySm.lineHeight,
      color: colors.text,
      backgroundColor: colors.surfaceRaised,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: Radius.compact,
      padding: Spacing.three,
      marginTop: Spacing.one,
      marginBottom: Spacing.two,
    },
    blockquote: {
      ...BODY,
      color: colors.textSecondary,
      borderColor: colors.borderVisible,
      borderWidth: 2,
      gapWidth: Spacing.three,
      backgroundColor: colors.surfaceRaised,
      borderRadius: Radius.compact,
      padding: Spacing.two,
      marginTop: Spacing.one,
      marginBottom: Spacing.two,
    },
    list: {
      ...BODY,
      color: colors.text,
      bulletColor: colors.textSecondary,
      markerColor: colors.textSecondary,
      gapWidth: Spacing.two,
      marginLeft: Spacing.three,
      marginBottom: Spacing.two,
    },
    table: {
      fontSize: 12,
      lineHeight: 17,
      fontFamily: Fonts.sans,
      color: colors.text,
      headerFontFamily: Fonts.sansMedium,
      headerBackgroundColor: colors.surfaceRaised,
      headerTextColor: colors.textDisplay,
      rowEvenBackgroundColor: colors.surface,
      rowOddBackgroundColor: colors.surfaceRaised,
      borderColor: colors.border,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: Radius.compact,
      cellPaddingHorizontal: Spacing.one,
      cellPaddingVertical: Spacing.one,
      marginTop: Spacing.one,
      marginBottom: Spacing.two,
      align: 'left',
      // Bleed into the bubble's 16 pt padding so wide tables reach its edges.
      horizontalOverflow: Spacing.three,
    },
    taskList: {
      checkedColor: colors.interactive,
      borderColor: colors.borderVisible,
      checkmarkColor: colors.background,
      checkboxSize: 16,
      checkboxBorderRadius: Radius.technical,
    },
    image: {
      borderRadius: Radius.compact,
      marginBottom: Spacing.two,
    },
  };
}


type MarkdownAnswerProps = {
  text: string;
  /** True while tokens are still arriving; enables tail-only fade and stable tables. */
  streaming?: boolean;
};

export const MarkdownAnswer = memo(function MarkdownAnswer({
  text,
  streaming = false,
}: MarkdownAnswerProps) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const markdownStyle = useMemo(() => buildStyle(Colors[scheme]), [scheme]);

  const markdown = useMemo(() => normalizeMarkdownHtml(text), [text]);

  const handleLinkPress = useCallback(({ url }: { url: string }) => {
    if (!isAllowedLink(url)) return;
    if (url.startsWith('mailto:') || url.startsWith('tel:')) {
      void Linking.openURL(url);
      return;
    }
    void WebBrowser.openBrowserAsync(url);
  }, []);

  return (
    <EnrichedMarkdownText
      markdown={markdown}
      flavor="github"
      streamingAnimation={streaming}
      streamingConfig={{ tableMode: 'progressive', codeBlockMode: 'progressive' }}
      markdownStyle={markdownStyle}
      onLinkPress={handleLinkPress}
    />
  );
});
