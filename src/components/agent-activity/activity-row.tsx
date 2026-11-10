import { useEffect, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import {
  CheckGlyph,
  FileGlyph,
  MessageGlyph,
  PencilGlyph,
  SearchGlyph,
  SparkleGlyph,
  TerminalGlyph,
  WrenchGlyph,
} from '@/components/agent-activity/agent-icons';
import { RiseIn } from '@/components/agent-activity/rise-in';
import type {
  AgentActivityItem,
  AgentActivitySearch,
  AgentActivityStep,
  AgentActivityText,
  AgentActivityTool,
  AgentActivityTrace,
  AgentSearchResult,
} from '@/components/agent-activity/types';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const PULSE_MS = 750;
const PULSE_LOW = 0.35;
const PULSE_HIGH = 0.8;
const PULSE_SWEEP = PULSE_HIGH - PULSE_LOW;
const HALO_OPACITY = 0.12;

type Theme = ReturnType<typeof useTheme>;

type AgentActivityRowProps = {
  item: AgentActivityItem;
  /** The last row ends the run's thread; every other row draws the connector. */
  isLast: boolean;
  onOpenResult?: (result: AgentSearchResult) => void;
  /** Set by `AgentActivity`; also holds the active mark's pulse still. */
  disabled?: boolean;
};

/** Plain strings take the row's type scale; rich nodes bring their own. */
function textOf(node: ReactNode, style: StyleProp<TextStyle>, lines?: number) {
  if (typeof node !== 'string' && typeof node !== 'number') return node;

  return (
    <Text numberOfLines={lines} style={style}>
      {node}
    </Text>
  );
}

function ActiveMark({ color, disabled }: { color: string; disabled: boolean }) {
  const reduced = useReducedMotion();
  const still = reduced || disabled;
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (still) {
      cancelAnimation(pulse);
      // Resting mid-sweep keeps the tone steady when motion is off; only opacity moves.
      pulse.set(0.5);
      return;
    }

    pulse.set(withRepeat(withTiming(1, { duration: PULSE_MS }), -1, true));

    return () => cancelAnimation(pulse);
  }, [pulse, still]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: PULSE_LOW + pulse.get() * PULSE_SWEEP,
  }));

  return (
    <View style={styles.stepMark}>
      {/* A 12% ink wash carries the halo; the sweep rides inside it, so the
          mark breathes without ever reaching full ink and reading as an alert. */}
      <View style={[styles.halo, { opacity: HALO_OPACITY }]}>
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.haloFill, { backgroundColor: color }, pulseStyle]}
        />
      </View>
      <View style={[styles.dot, { backgroundColor: color }]} />
    </View>
  );
}

function StepRow({
  item,
  isLast,
  disabled,
  theme,
}: {
  item: AgentActivityStep;
  isLast: boolean;
  disabled: boolean;
  theme: Theme;
}) {
  const status = item.status ?? 'complete';
  const ink = status === 'active' ? theme.text : theme.textSecondary;

  return (
    <View style={styles.stepRow}>
      {/* Behind the marks, so a run of steps reads as one sequence. */}
      {isLast ? null : (
        <View style={[styles.connector, { backgroundColor: theme.borderVisible }]} />
      )}
      {status === 'complete' ? (
        <View style={styles.stepMark}>
          <CheckGlyph size={14} color={theme.textSecondary} strokeWidth={1.8} />
        </View>
      ) : status === 'active' ? (
        <ActiveMark color={theme.text} disabled={disabled} />
      ) : (
        <View style={styles.stepMark}>
          <View style={[styles.pending, { borderColor: theme.borderVisible }]} />
        </View>
      )}
      <View style={styles.stepBody}>
        {textOf(item.label, [
          styles.rowText,
          status === 'active' && styles.emphasis,
          { color: ink },
        ])}
      </View>
      {item.meta ? (
        <Text style={[styles.mono, { color: theme.textDisabled }]}>{item.meta}</Text>
      ) : null}
    </View>
  );
}

function TextRow({ item, theme }: { item: AgentActivityText; theme: Theme }) {
  return (
    <View style={styles.textRow}>
      {textOf(item.content, [styles.rowText, { color: theme.textSecondary }])}
    </View>
  );
}

function SearchRow({
  item,
  onOpenResult,
  disabled,
  theme,
}: {
  item: AgentActivitySearch;
  onOpenResult?: (result: AgentSearchResult) => void;
  disabled: boolean;
  theme: Theme;
}) {
  return (
    <View>
      <View style={styles.queryRow}>
        <SearchGlyph size={14} color={theme.textSecondary} />
        <Text
          numberOfLines={1}
          style={[styles.rowText, styles.flex, { color: theme.textSecondary }]}>
          {item.query}
        </Text>
      </View>
      {(item.results ?? []).map((result) => {
        const link = Boolean(result.url && onOpenResult);
        const body = (
          <>
            {result.icon ? <View style={styles.resultIcon}>{result.icon}</View> : null}
            <View style={styles.resultText}>
              <Text
                numberOfLines={1}
                style={[styles.rowText, styles.emphasis, { color: theme.text }]}>
                {result.title}
              </Text>
              {result.domain ? (
                <Text numberOfLines={1} style={[styles.mono, { color: theme.textDisabled }]}>
                  {result.domain}
                </Text>
              ) : null}
            </View>
          </>
        );

        return (
          <RiseIn key={result.id} disabled={disabled}>
            {link ? (
              <Pressable
                accessibilityRole="link"
                onPress={() => onOpenResult?.(result)}
                style={styles.resultRow}>
                {body}
              </Pressable>
            ) : (
              <View style={styles.resultRow}>{body}</View>
            )}
          </RiseIn>
        );
      })}
      {item.moreCount !== undefined && item.moreCount > 0 ? (
        <Text style={[styles.mono, styles.more, { color: theme.textDisabled }]}>
          +{item.moreCount} more results
        </Text>
      ) : null}
    </View>
  );
}

function ToolRow({ item, theme }: { item: AgentActivityTool; theme: Theme }) {
  const action = String(item.action ?? '');
  const label = action.charAt(0).toUpperCase() + action.slice(1);
  const hasCounts = item.additions !== undefined || item.deletions !== undefined;

  return (
    <View style={styles.toolRow}>
      <Text style={[styles.rowText, styles.emphasis, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <View style={[styles.chip, { backgroundColor: theme.surfaceRaised }]}>
        <Text numberOfLines={1} style={[styles.mono, { color: theme.textSecondary }]}>
          {item.target}
        </Text>
      </View>
      {hasCounts ? (
        <View style={styles.counts}>
          {item.additions !== undefined ? (
            <Text style={[styles.mono, { color: theme.success }]}>+{item.additions}</Text>
          ) : null}
          {item.deletions !== undefined ? (
            <Text style={[styles.mono, { color: theme.error }]}>−{item.deletions}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/** The mark says what the run touched, so a scanned trace reads without its label. */
function traceGlyph(kind: string, color: string) {
  switch (kind) {
    case 'thinking':
      return <SparkleGlyph size={14} color={color} />;
    case 'message':
      return <MessageGlyph size={14} color={color} />;
    case 'write':
      return <PencilGlyph size={14} color={color} />;
    case 'run':
      return <TerminalGlyph size={14} color={color} />;
    case 'read':
      return <FileGlyph size={14} color={color} />;
    default:
      return <WrenchGlyph size={14} color={color} />;
  }
}

function TraceRow({ item, theme }: { item: AgentActivityTrace; theme: Theme }) {
  return (
    <View style={styles.traceRow}>
      <View style={styles.traceIcon}>
        {item.icon ?? traceGlyph(item.kind, theme.textSecondary)}
      </View>
      {textOf(item.label, [styles.rowText, styles.flex, { color: theme.textSecondary }])}
      {item.detail ? (
        <Text
          numberOfLines={1}
          style={[styles.mono, styles.traceDetail, { color: theme.textDisabled }]}>
          {item.detail}
        </Text>
      ) : null}
    </View>
  );
}

export function AgentActivityRow({
  item,
  isLast,
  onOpenResult,
  disabled = false,
}: AgentActivityRowProps) {
  const theme = useTheme();

  switch (item.type) {
    case 'step':
      return <StepRow item={item} isLast={isLast} disabled={disabled} theme={theme} />;
    case 'text':
      return <TextRow item={item} theme={theme} />;
    case 'search':
      return (
        <SearchRow item={item} onOpenResult={onOpenResult} disabled={disabled} theme={theme} />
      );
    case 'tool':
      return <ToolRow item={item} theme={theme} />;
    case 'trace':
      return <TraceRow item={item} theme={theme} />;
    default:
      return assertNever(item);
  }
}

function assertNever(value: never): null {
  return null;
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    minWidth: 0,
  },
  rowText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 21,
  },
  emphasis: {
    fontFamily: Fonts.sansMedium,
  },
  mono: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    lineHeight: 16,
    fontVariant: ['tabular-nums'],
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 28,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  stepMark: {
    width: 11,
    height: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBody: {
    flex: 1,
    minWidth: 0,
  },
  connector: {
    position: 'absolute',
    left: 13.5,
    top: 22,
    bottom: -4,
    width: StyleSheet.hairlineWidth,
  },
  halo: {
    position: 'absolute',
    left: -7.5,
    top: -7.5,
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  haloFill: {
    borderRadius: 13,
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
  },
  pending: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 1.5,
  },
  textRow: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  queryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 28,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 28,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two,
    paddingVertical: 2,
  },
  resultIcon: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultText: {
    flex: 1,
    minWidth: 0,
  },
  more: {
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two,
    paddingVertical: 2,
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 32,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  chip: {
    flex: 1,
    minWidth: 0,
    borderRadius: Radius.compact,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    justifyContent: 'center',
  },
  counts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  traceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 28,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  traceIcon: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  traceDetail: {
    flexShrink: 1,
  },
});
