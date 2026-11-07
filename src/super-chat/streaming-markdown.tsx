import { useEffect, useMemo, type ReactNode } from 'react';
import {
  Linking,
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  isAllowedLink,
  parseMarkdown,
  type MarkdownBlock,
  type MarkdownInline,
} from '@/super-chat/chat-markdown';
import { StreamingWord } from '@/super-chat/streaming-text';
import { STREAM_REVEAL_MS, tokenizeStreamingText } from '@/super-chat/streaming-timing';

type Theme = ReturnType<typeof useTheme>;

const EASE_SMOOTH_OUT = Easing.bezier(0.23, 1, 0.32, 1);

/**
 * Renders an assistant answer as Markdown while keeping the per-word dissolve.
 *
 * PanelUI's `Response` renders whole blocks; this renderer walks the same
 * constructs but gives every word its own top-level `Text`. That matters on
 * Android, where a nested `Text` is a virtual span and Reanimated cannot
 * animate its opacity.
 */
export function StreamingMarkdown({ text, animate = true }: { text: string; animate?: boolean }) {
  const theme = useTheme();
  const blocks = useMemo(
    () => parseMarkdown(text, { streaming: animate }),
    [text, animate],
  );

  return (
    <View style={styles.blocks}>
      {blocks.map((block, index) => renderBlock(block, `block-${index}`, theme, animate))}
    </View>
  );
}

function renderBlock(
  block: MarkdownBlock,
  key: string,
  theme: Theme,
  animate: boolean,
): ReactNode {
  switch (block.type) {
    case 'heading': {
      const headingStyle =
        block.level <= 1 ? styles.headingLarge : block.level === 2 ? styles.heading : styles.headingSmall;

      return (
        <View key={key} style={styles.headingBlock}>
          {renderInlineFlow(
            block.inlines,
            `${key}-inline`,
            theme,
            animate,
            [headingStyle, { color: theme.text }],
          )}
        </View>
      );
    }

    case 'paragraph':
      return (
        <View key={key}>
          {renderInlineFlow(block.inlines, `${key}-inline`, theme, animate, [
            styles.paragraph,
            { color: theme.text },
          ])}
        </View>
      );

    case 'list':
      return (
        <View key={key} style={styles.list}>
          {block.items.map((item, itemIndex) => (
            <View key={`${key}-item-${itemIndex}`} style={styles.listRow}>
              <StreamingWord
                key={`${key}-marker-${itemIndex}`}
                text={item.marker}
                animate={animate}
                style={[styles.marker, { color: theme.textSecondary }]}
              />
              <View style={styles.listInline}>
                {renderInlineFlow(
                  item.inlines,
                  `${key}-item-${itemIndex}`,
                  theme,
                  animate,
                  [styles.listText, { color: theme.text }],
                )}
              </View>
            </View>
          ))}
        </View>
      );

    case 'quote': {
      return (
        <View key={key} style={styles.quote}>
          <StreamingChrome
            animate={animate}
            style={[styles.quoteBorder, { backgroundColor: theme.borderVisible }]}
          />
          <View style={styles.quoteBody}>
            {renderInlineFlow(
              block.inlines,
              `${key}-inline`,
              theme,
              animate,
              [styles.quoteText, { color: theme.textSecondary }],
            )}
          </View>
        </View>
      );
    }

    case 'code': {
      // The chrome fades in with its first word, like every other block, so the
      // empty block never appears ahead of the prose before it.
      const lines = block.code.split('\n');

      return (
        <View
          key={key}
          accessible
          accessibilityLabel={
            block.language ? `${block.language} code. ${block.code}` : block.code
          }
          accessibilityRole="text"
          style={styles.codeBlock}>
          <StreamingChrome
            animate={animate}
            style={[
              StyleSheet.absoluteFill,
              styles.codeChrome,
              { backgroundColor: theme.surfaceRaised, borderColor: theme.border },
            ]}
          />
          {block.language ? (
            <StreamingWord
              text={block.language}
              animate={animate}
              style={[styles.codeLanguage, { color: theme.textSecondary }]}
            />
          ) : null}
          {lines.map((line, lineIndex) => (
            <StreamingWord
              key={`${key}-line-${lineIndex}`}
              text={line.length > 0 ? line : ' '}
              animate={animate}
              style={[styles.codeText, { color: theme.textDisplay }]}
            />
          ))}
        </View>
      );
    }

    case 'rule':
      return (
        <StreamingChrome
          key={key}
          animate={animate}
          style={[styles.rule, { backgroundColor: theme.border }]}
        />
      );
  }
}

type FlowToken = {
  text: string;
  /** Whitespace from the source, kept inside the word view so punctuation stays attached. */
  trailing: string;
  style: StyleProp<TextStyle>;
  onPress?: () => void;
};

/**
 * A wrapping row of word views. Inline code and links stay as one view so
 * their background and tap target are continuous; every other segment is split
 * so each word dissolves on its own mount. Whitespace travels with the
 * preceding word, not as a gap, so `**details**,` never renders as `details ,`.
 */
function renderInlineFlow(
  inlines: MarkdownInline[],
  keyPrefix: string,
  theme: Theme,
  animate: boolean,
  textStyle: StyleProp<TextStyle>,
): ReactNode {
  const tokens = buildFlowTokens(inlines, theme);

  return (
    <View
      accessible
      accessibilityLabel={inlines.map((inline) => inline.text).join('')}
      accessibilityRole="text"
      style={styles.flow}>
      {tokens.map((token, tokenIndex) => (
        <StreamingWord
          key={`${keyPrefix}-${tokenIndex}`}
          text={token.text}
          trailing={token.trailing}
          animate={animate}
          style={[textStyle, token.style]}
          onPress={token.onPress}
        />
      ))}
    </View>
  );
}

function buildFlowTokens(inlines: MarkdownInline[], theme: Theme): FlowToken[] {
  const tokens: FlowToken[] = [];

  const appendWhitespace = (whitespace: string) => {
    if (whitespace && tokens.length > 0) {
      tokens[tokens.length - 1].trailing += whitespace;
    }
  };

  inlines.forEach((segment) => {
    const style = inlineStyle(segment, theme);
    const leading = segment.text.match(/^\s*/)?.[0] ?? '';
    const body = segment.text.slice(leading.length);

    // A segment boundary can fall in the middle of a word (bold "detail" plus
    // ", masalahnya"). Keep the original whitespace, or the comma would get a
    // word gap before it.
    appendWhitespace(leading);

    if (!body) return;

    const canPress = segment.href !== undefined && isAllowedLink(segment.href);

    if (segment.code || canPress) {
      const trailing = body.match(/\s*$/)?.[0] ?? '';
      const text = body.slice(0, body.length - trailing.length);

      if (!text) {
        appendWhitespace(trailing);
        return;
      }

      tokens.push({
        text,
        trailing,
        style,
        onPress: canPress
          ? () => {
              void Linking.openURL(segment.href as string).catch(() => {});
            }
          : undefined,
      });
      return;
    }

    const parts = tokenizeStreamingText(body);
    parts.forEach((part, partIndex) => {
      if (part.wordIndex < 0) return;

      const next = parts[partIndex + 1];
      tokens.push({
        text: part.text,
        trailing: next && next.wordIndex < 0 ? next.text : '',
        style,
      });
    });
  });

  return tokens;
}

/**
 * Chrome around a block (quote border, code surface, rule) fades in on mount
 * alongside its words, so the empty block never paints ahead of the prose.
 */
function StreamingChrome({
  animate,
  style,
}: {
  animate: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (!animate) {
      opacity.value = 1;
      return;
    }

    opacity.value = withTiming(1, {
      duration: STREAM_REVEAL_MS,
      easing: EASE_SMOOTH_OUT,
    });
  }, [animate, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View pointerEvents="none" style={[style, animatedStyle]} />;
}

function inlineStyle(segment: MarkdownInline, theme: Theme): StyleProp<TextStyle> {
  return [
    segment.bold ? styles.bold : null,
    segment.italic ? styles.italic : null,
    segment.strike ? styles.strike : null,
    segment.code
      ? [styles.inlineCode, { backgroundColor: theme.surfaceRaised, color: theme.textDisplay }]
      : null,
    segment.href ? [styles.link, { color: theme.interactive }] : null,
  ];
}

const styles = StyleSheet.create({
  blocks: {
    width: '100%',
    gap: Spacing.two,
  },
  flow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
  },
  headingBlock: {
    marginTop: Spacing.one,
  },
  paragraph: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 24,
  },
  headingLarge: {
    fontFamily: Fonts.sansBold,
    fontSize: 20,
    lineHeight: 28,
  },
  heading: {
    fontFamily: Fonts.sansBold,
    fontSize: 18,
    lineHeight: 26,
  },
  headingSmall: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    lineHeight: 24,
  },
  list: {
    gap: Spacing.one,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  listInline: {
    flex: 1,
  },
  listText: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 24,
  },
  marker: {
    fontFamily: Fonts.sansMedium,
    fontSize: 15,
    lineHeight: 24,
    minWidth: 18,
  },
  quote: {
    paddingLeft: Spacing.two,
  },
  quoteBody: {
    paddingVertical: Spacing.half,
  },
  quoteBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
  },
  quoteText: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 23,
    fontStyle: 'italic',
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.one,
  },
  codeBlock: {
    borderRadius: Spacing.two,
    padding: Spacing.two,
  },
  codeChrome: {
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  codeLanguage: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1,
    marginBottom: Spacing.half,
    textTransform: 'uppercase',
  },
  codeText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    lineHeight: 19,
  },
  bold: {
    fontFamily: Fonts.sansBold,
  },
  italic: {
    fontStyle: 'italic',
  },
  strike: {
    textDecorationLine: 'line-through',
  },
  inlineCode: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    lineHeight: 20,
    borderRadius: 4,
    paddingHorizontal: Spacing.half,
  },
  link: {
    textDecorationLine: 'underline',
  },
});
