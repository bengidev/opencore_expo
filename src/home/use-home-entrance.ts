import { useEffect } from 'react';
import {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const DURATION_MS = 280;
const OFFSET = 8;

function useFadeUp(progress: SharedValue<number>, reduce: SharedValue<boolean>) {
  return useAnimatedStyle(() => {
    const t = progress.get();
    return {
      opacity: t,
      transform: [{ translateY: reduce.get() ? 0 : (1 - t) * OFFSET }],
    };
  });
}

export function useHomeEntrance() {
  const reducedMotion = useReducedMotion() ?? false;
  const reduce = useSharedValue(reducedMotion);
  const prompt = useSharedValue(0);
  const composer = useSharedValue(0);

  useEffect(() => {
    reduce.set(reducedMotion);
    const timing = { duration: DURATION_MS, easing: EASE_OUT };
    prompt.set(withDelay(40, withTiming(1, timing)));
    composer.set(withDelay(100, withTiming(1, timing)));

    return () => {
      cancelAnimation(prompt);
      cancelAnimation(composer);
      prompt.set(0);
      composer.set(0);
    };
  }, [composer, prompt, reduce, reducedMotion]);

  return {
    prompt: useFadeUp(prompt, reduce),
    composer: useFadeUp(composer, reduce),
  };
}
