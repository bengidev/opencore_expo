import { useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
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

/** Bot steps up into place. First-time only, so it can run a little past a normal UI beat. */
const HERO_MS = 420;
/** How far below its resting spot the bot starts, as a fraction of the window. */
const RISE_FRACTION = 0.28;
const RISE_MAX = 260;
/** Close to full size. Nothing on screen should appear out of nothing. */
const SCALE_FROM = 0.9;
/** Opacity finishes here, while the bot is still settling into place. */
const APPEAR_AT = 0.45;

const FADE_MS = 240;
const ENTER_OFFSET = 8;
const SPEECH_SCALE_FROM = 0.96;

/**
 * Chrome follows the bot. The bubble waits until the bot is mostly in place,
 * then pops from its tail — a reply, not another row in the stagger.
 */
const DELAY_MS = {
  headline: 60,
  speech: Math.round(HERO_MS * 0.52),
  subtitle: Math.round(HERO_MS * 0.52) + 120,
  button: Math.round(HERO_MS * 0.52) + 170,
} as const;

type CopyPart = keyof typeof DELAY_MS;

const TIMING = {
  duration: FADE_MS,
  easing: EASE_OUT,
  reduceMotion: ReduceMotion.Never,
} as const;

function useFadeUp(
  progress: SharedValue<number>,
  reduce: SharedValue<boolean>,
  scaleFrom?: number,
) {
  return useAnimatedStyle(() => {
    const t = progress.get();
    const offset = reduce.get() ? 0 : (1 - t) * ENTER_OFFSET;
    const scale =
      scaleFrom != null && !reduce.get() ? scaleFrom + (1 - scaleFrom) * t : 1;
    return {
      opacity: t,
      transform: [{ translateY: offset }, { scale }],
    };
  });
}

export function useOnboardingEntrance() {
  const reducedMotion = useReducedMotion();
  const { height: windowHeight } = useWindowDimensions();
  const reduce = useSharedValue(reducedMotion);
  const rise = useSharedValue(Math.min(windowHeight * RISE_FRACTION, RISE_MAX));
  const headline = useSharedValue(0);
  const hero = useSharedValue(0);
  const speech = useSharedValue(0);
  const subtitle = useSharedValue(0);
  const button = useSharedValue(0);

  useEffect(() => {
    reduce.set(reducedMotion);
    const copy = { headline, speech, subtitle, button };

    if (reducedMotion) {
      const fade = { duration: 180, easing: EASE_OUT, reduceMotion: ReduceMotion.Never };
      hero.set(withTiming(1, fade));
      (Object.keys(copy) as CopyPart[]).forEach((part) => {
        copy[part].set(withTiming(1, fade));
      });
    } else {
      hero.set(withTiming(1, { duration: HERO_MS, easing: EASE_OUT, reduceMotion: ReduceMotion.Never }));
      (Object.keys(DELAY_MS) as CopyPart[]).forEach((part) => {
        copy[part].set(withDelay(DELAY_MS[part], withTiming(1, TIMING)));
      });
    }

    return () => {
      cancelAnimation(hero);
      hero.set(0);
      (Object.keys(copy) as CopyPart[]).forEach((part) => {
        cancelAnimation(copy[part]);
        copy[part].set(0);
      });
    };
  }, [button, headline, hero, reduce, reducedMotion, speech, subtitle]);

  const headlineStyle = useFadeUp(headline, reduce);
  const heroStyle = useAnimatedStyle(() => {
    const progress = hero.get();
    if (reduce.get()) {
      return {
        opacity: progress,
        transform: [{ translateY: 0 }, { scale: 1 }],
      };
    }
    return {
      opacity: Math.min(1, progress / APPEAR_AT),
      transform: [
        { translateY: (1 - progress) * rise.get() },
        { scale: SCALE_FROM + (1 - SCALE_FROM) * progress },
      ],
    };
  });
  const speechStyle = useAnimatedStyle(() => {
    const pop = speech.get();
    if (reduce.get()) {
      return {
        opacity: pop,
        transform: [{ translateY: 0 }, { scale: 1 }],
      };
    }
    return {
      opacity: pop,
      transform: [
        { translateY: (1 - hero.get()) * rise.get() },
        { scale: SPEECH_SCALE_FROM + (1 - SPEECH_SCALE_FROM) * pop },
      ],
    };
  });
  const subtitleStyle = useFadeUp(subtitle, reduce);
  const buttonStyle = useFadeUp(button, reduce);

  return {
    headline: headlineStyle,
    hero: heroStyle,
    speech: speechStyle,
    subtitle: subtitleStyle,
    button: buttonStyle,
  };
}
