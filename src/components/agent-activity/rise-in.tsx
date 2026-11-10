import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutUp,
  LinearTransition,
  useReducedMotion,
} from 'react-native-reanimated';

import { EASE_OUT, SPRING_LAYOUT } from '@/components/agent-activity/motion';

// Reanimated's plain FadeIn/FadeOut only animate opacity; the directional
// presets are the ones that carry a translateY, retuned here to the log's
// 6 pt rise and 3 pt exit drift.
const RISE_IN = FadeInDown.duration(180).easing(EASE_OUT).withInitialValues({ translateY: 6 });

const RISE_OUT = FadeOutUp.duration(140).easing(EASE_OUT).withTargetValues({ translateY: -3 });

const ROW_LAYOUT = LinearTransition.springify()
  .stiffness(SPRING_LAYOUT.stiffness)
  .damping(SPRING_LAYOUT.damping)
  .mass(SPRING_LAYOUT.mass);

type RiseInProps = {
  children: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Rows arrive by rising a few points into place and leave by drifting back up,
 * which keeps the newest line readable while older ones settle underneath.
 * With motion switched off the same wrapper renders plainly, so layout still
 * changes and nothing jiggles.
 */
export function RiseIn({ children, disabled = false, style }: RiseInProps) {
  const reduced = useReducedMotion();
  const motion = reduced || disabled;

  if (motion) {
    return <Animated.View style={style}>{children}</Animated.View>;
  }

  return (
    <Animated.View entering={RISE_IN} exiting={RISE_OUT} layout={ROW_LAYOUT} style={style}>
      {children}
    </Animated.View>
  );
}
