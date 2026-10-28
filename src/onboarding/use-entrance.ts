import { useEffect } from 'react';
import {
  Easing,
  ReduceMotion,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

const FADE_MS = 240;
const ENTER_OFFSET = 8;

const DELAY_MS = {
  headline: 60,
  subtitle: 338,
  button: 388,
} as const;

type CopyPart = keyof typeof DELAY_MS;

const TIMING = {
  duration: FADE_MS,
  easing: EASE_OUT,
  reduceMotion: ReduceMotion.Never,
} as const;

function useFadeUp(progress: SharedValue<number>, reduce: SharedValue<boolean>) {
  return useAnimatedStyle(() => {
    const t = progress.get();
    const offset = reduce.get() ? 0 : (1 - t) * ENTER_OFFSET;
    return {
      opacity: t,
      transform: [{ translateY: offset }],
    };
  });
}

export function useOnboardingEntrance() {
  const reducedMotion = useReducedMotion();
  const reduce = useSharedValue(reducedMotion);
  const headline = useSharedValue(0);
  const subtitle = useSharedValue(0);
  const button = useSharedValue(0);

  useEffect(() => {
    reduce.set(reducedMotion);
    const copy = { headline, subtitle, button };

    if (reducedMotion) {
      const fade = { duration: 180, easing: EASE_OUT, reduceMotion: ReduceMotion.Never };
      (Object.keys(copy) as CopyPart[]).forEach((part) => {
        copy[part].set(withTiming(1, fade));
      });
    } else {
      (Object.keys(DELAY_MS) as CopyPart[]).forEach((part) => {
        copy[part].set(withDelay(DELAY_MS[part], withTiming(1, TIMING)));
      });
    }

    return () => {
      (Object.keys(copy) as CopyPart[]).forEach((part) => {
        cancelAnimation(copy[part]);
        copy[part].set(0);
      });
    };
  }, [button, headline, reduce, reducedMotion, subtitle]);

  return {
    headline: useFadeUp(headline, reduce),
    subtitle: useFadeUp(subtitle, reduce),
    button: useFadeUp(button, reduce),
  };
}
