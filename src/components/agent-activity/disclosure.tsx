import { useEffect, type ReactNode } from 'react';
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { EASE_OUT } from '@/components/agent-activity/motion';

const OPEN_MS = 220;
const CLOSE_MS = 140;

/** Timed when motion is allowed, exact when the caller or the system opts out. */
function nextHeight(open: boolean, contentHeight: number, still: boolean): number {
  const target = open ? contentHeight : 0;
  if (still) return target;

  return withTiming(target, {
    duration: open ? OPEN_MS : CLOSE_MS,
    easing: EASE_OUT,
  });
}

type DisclosureProps = {
  open: boolean;
  disabled?: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Folding a log must not restart its children: `StreamingText` dissolves each
 * word on mount, so remounting the log on every toggle would replay the whole
 * trace. The content therefore stays mounted in both states, absolutely
 * positioned so it can report its natural height even while the animated
 * container is 0 pt tall.
 */
export function Disclosure({ open, disabled = false, children, style }: DisclosureProps) {
  const reduced = useReducedMotion();
  const still = reduced || disabled;
  const contentHeight = useSharedValue(0);
  const height = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({ height: height.get() }));

  useEffect(() => {
    height.set(nextHeight(open, contentHeight.get(), still));
  }, [contentHeight, height, open, still]);

  function handleLayout(event: LayoutChangeEvent) {
    const measured = event.nativeEvent.layout.height;
    contentHeight.set(measured);
    if (!open) return;
    // While the log is open, a layout change is new content arriving. Follow
    // it exactly: a timed height restarts on every delta and settles ~220 ms
    // behind the stream, so the newest line stays clipped for as long as the
    // model keeps talking. Only the unfold from zero is animated.
    height.set(height.get() === 0 ? nextHeight(true, measured, still) : measured);
  }

  // The children stay mounted while folded, so hide the collapsed subtree
  // from screen readers explicitly rather than relying on its zero height.
  return (
    <Animated.View
      accessibilityElementsHidden={!open}
      importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
      style={[styles.root, style, animatedStyle]}>
      <View style={styles.content} onLayout={handleLayout}>
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
