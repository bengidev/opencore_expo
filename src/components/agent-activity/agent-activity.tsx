import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Shimmer } from 'panelui-native/components/shimmer';

import { AgentActivityRow } from '@/components/agent-activity/activity-row';
import { ChevronDownGlyph } from '@/components/agent-activity/agent-icons';
import { activeLabelFor, contentTypeOf, summaryFor } from '@/components/agent-activity/copy';
import { Disclosure } from '@/components/agent-activity/disclosure';
import { FadeEdge } from '@/components/agent-activity/fade-edge';
import { SPRING_LAYOUT, SPRING_SWAP } from '@/components/agent-activity/motion';
import { RiseIn } from '@/components/agent-activity/rise-in';
import type {
  AgentActivityContentType,
  AgentActivityItem,
  AgentActivityStatus,
  AgentSearchResult,
} from '@/components/agent-activity/types';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const HEADER_HEIGHT = 28;
const DEFAULT_MAX_HEIGHT = 208;
const SHIMMER_MS = 1200;
const FADE_HEIGHT = 12;
const CHEVRON_SIZE = 14;

export type AgentActivityProps = {
  items: AgentActivityItem[];
  contentType?: AgentActivityContentType;
  status?: AgentActivityStatus;
  /** Whole seconds the run took; drives the default summary. */
  duration?: number;
  /** Controlled open state; when set, the internal state is ignored. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Fold once the run completes. A run that is still working is always open. */
  collapseOnComplete?: boolean;
  activeLabel?: ReactNode;
  summary?: ReactNode;
  maxHeight?: number;
  onOpenResult?: (result: AgentSearchResult) => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  disableAnimation?: boolean;
};

/** Plain strings take the status type scale; rich nodes bring their own. */
function summaryText(node: ReactNode, style: StyleProp<TextStyle>) {
  if (typeof node !== 'string' && typeof node !== 'number') return node;

  return (
    <Text numberOfLines={1} style={style}>
      {node}
    </Text>
  );
}

/**
 * One run's activity, from the working header through the rows it left behind.
 * The log is always present while working; once the run settles it folds to a
 * tappable summary so the answer below owns the eye.
 */
export function AgentActivity({
  items,
  contentType,
  status = 'complete',
  duration = 0,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  collapseOnComplete = true,
  activeLabel,
  summary,
  maxHeight = DEFAULT_MAX_HEIGHT,
  onOpenResult,
  style,
  contentStyle,
  disableAnimation = false,
}: AgentActivityProps) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const still = reduced || disableAnimation;

  const type = contentTypeOf(items, contentType);
  const working = status === 'working';
  const label = activeLabel ?? activeLabelFor(type);
  const summaryLabel = summary ?? summaryFor(items, type, duration);

  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const [previousWorking, setPreviousWorking] = useState(working);
  const isOpen = controlledOpen ?? uncontrolledOpen;
  const expanded = working || isOpen;

  const [contentHeight, setContentHeight] = useState(0);
  const capped = contentHeight > maxHeight;
  const viewport = Math.min(contentHeight, maxHeight);

  // The fades follow the offset, which the log resets outside `onScroll` (a
  // reopened log and a run that starts over both jump back to the top).
  // Scrolling re-renders only when a band appears or disappears: the raw offset
  // lives in a ref, and two booleans exist solely to drive the fades.
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(true);
  const scrollYRef = useRef(0);
  const [resetKey, setResetKey] = useState(`${expanded}:${working}`);

  const scrollRef = useRef<ScrollViewInstance>(null);
  const measured = useRef(false);
  const announced = useRef(working);
  const glide = useSharedValue(0);
  const turn = useSharedValue(expanded ? 1 : 0);

  // While working, the newest row stays pinned: the content glides up by
  // whatever overflows the viewport. Completed, it returns to the top so the
  // reader starts at the beginning of the trace.
  useLayoutEffect(() => {
    const target = working ? Math.min(0, viewport - contentHeight) : 0;
    // A working log mounts already pinned to its newest row: its first painted
    // frame is the final offset, not a spring up from the top.
    const seeded = working && !measured.current;
    if (contentHeight > 0) measured.current = true;
    // Streamed words arrive every few frames; a spring restarted on each delta
    // settles behind the text and clips the newest line until the model pauses.
    // Pinning directly keeps the last line whole — the per-token shift is a few
    // pixels, so it still reads as a glide. The spring is for discrete moves.
    glide.set(working || still || seeded ? target : withSpring(target, SPRING_LAYOUT));
  }, [contentHeight, glide, still, viewport, working]);

  useEffect(() => {
    const target = expanded ? 1 : 0;
    turn.set(still ? target : withSpring(target, SPRING_SWAP));
  }, [expanded, still, turn]);

  // Reopening starts at the top, and a run that starts working again begins pinned
  // to its newest row; while working the glide owns the position, so the reset only
  // matters on the first readable frame.
  useEffect(() => {
    if (!expanded) return;
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    scrollYRef.current = 0;
  }, [expanded, working]);

  // A completed run is worth a word to a screen reader once, but a panel that
  // mounts already complete is not news.
  useEffect(() => {
    if (announced.current === working) return;
    announced.current = working;
    if (working || typeof summaryLabel !== 'string') return;
    AccessibilityInfo.announceForAccessibility(summaryLabel);
  }, [summaryLabel, working]);

  const glideStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: glide.get() }],
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.get() * 180}deg` }],
  }));

  // Completion folds the log; keeping it open is opt-in, and only a tap reports
  // the change back to a controlled parent. Adjusting state during render (not
  // in an effect) settles the header and the disclosure in one commit.
  if (previousWorking !== working) {
    setPreviousWorking(working);
    if (!working && controlledOpen === undefined) {
      setUncontrolledOpen(!collapseOnComplete);
    }
  }

  // The reset lands with the imperative scrollTo above, before the next paint.
  const nextResetKey = `${expanded}:${working}`;
  if (resetKey !== nextResetKey) {
    setResetKey(nextResetKey);
    setShowTop(false);
    setShowBottom(true);
  }

  function handleContentLayout(event: LayoutChangeEvent) {
    const height = event.nativeEvent.layout.height;
    setContentHeight(height);
    // A completed log can grow or shrink without a scroll; recomputing from the
    // last offset keeps a band from outliving the overflow it was showing.
    const nextViewport = Math.min(height, maxHeight);
    setShowTop(scrollYRef.current > 0.5);
    setShowBottom(scrollYRef.current < height - nextViewport - 0.5);
  }

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const y = event.nativeEvent.contentOffset.y;
    const overflow = contentHeight - viewport - 0.5;
    const wasTop = scrollYRef.current > 0.5;
    const wasBottom = scrollYRef.current < overflow;
    scrollYRef.current = y;
    // Dispatch only on a flip: the booleans drive two fade strips, and the rows
    // must not re-render for every frame of a scroll.
    const nextTop = y > 0.5;
    const nextBottom = y < overflow;
    if (nextTop !== wasTop) setShowTop(nextTop);
    if (nextBottom !== wasBottom) setShowBottom(nextBottom);
  }

  function toggle() {
    const next = !isOpen;
    if (controlledOpen === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  }

  return (
    <View style={style} accessibilityState={{ busy: working }}>
      <View style={styles.header}>
        {working ? (
          <Shimmer
            as="text"
            duration={SHIMMER_MS}
            enabled={!disableAnimation}
            baseColor={theme.textSecondary}
            shimmerColor={theme.text}
            textStyle={[styles.status, styles.statusFill, { color: theme.textSecondary }]}
            accessibilityLiveRegion="polite">
            {label}
          </Shimmer>
        ) : (
          <Pressable
            testID="agent-activity-summary"
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={toggle}
            style={styles.summaryRow}>
            {summaryText(summaryLabel, [
              styles.status,
              styles.summaryText,
              { color: theme.textSecondary },
            ])}
            <Animated.View style={[styles.chevron, chevronStyle]}>
              <ChevronDownGlyph size={CHEVRON_SIZE} color={theme.textDisabled} />
            </Animated.View>
          </Pressable>
        )}
      </View>
      <Disclosure open={expanded} disabled={disableAnimation}>
        <View style={styles.log}>
          <ScrollView
            ref={scrollRef}
            style={{ maxHeight }}
            scrollEnabled={!working && capped}
            nestedScrollEnabled
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}>
            <Animated.View onLayout={handleContentLayout} style={[contentStyle, glideStyle]}>
              {items.map((item, index) => (
                <RiseIn key={item.id} disabled={disableAnimation}>
                  <AgentActivityRow
                    item={item}
                    isLast={index === items.length - 1}
                    onOpenResult={onOpenResult}
                    disabled={disableAnimation}
                  />
                </RiseIn>
              ))}
            </Animated.View>
          </ScrollView>
          {capped && (working || showTop) ? (
            <FadeEdge edge="top" color={theme.background} height={FADE_HEIGHT} />
          ) : null}
          {!working && capped && showBottom ? (
            <FadeEdge edge="bottom" color={theme.background} height={FADE_HEIGHT} />
          ) : null}
        </View>
      </Disclosure>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.one,
  },
  // `color` comes from the theme at render; the rest is the chrome's label scale.
  status: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    lineHeight: 13.2,
    letterSpacing: 0.88,
  },
  statusFill: {
    flexShrink: 1,
  },
  summaryRow: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryText: {
    flexShrink: 1,
  },
  chevron: {
    width: CHEVRON_SIZE,
    height: CHEVRON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  log: {
    position: 'relative',
  },
});
