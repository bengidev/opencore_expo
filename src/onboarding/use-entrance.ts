import { useEffect, useState } from 'react';
import {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

export type EntrancePart = 'headline' | 'hero' | 'speech' | 'subtitle' | 'button';

const DELAY: Record<EntrancePart, number> = {
  headline: 0,
  hero: 350,
  speech: 700,
  subtitle: 1050,
  button: 1400,
};

const FADE = {
  duration: 350,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};

const HIDDEN: Record<EntrancePart, boolean> = {
  headline: false,
  hero: false,
  speech: false,
  subtitle: false,
  button: false,
};

const SHOWN: Record<EntrancePart, boolean> = {
  headline: true,
  hero: true,
  speech: true,
  subtitle: true,
  button: true,
};

export function useOnboardingEntrance() {
  const reducedMotion = useReducedMotion();
  const headline = useSharedValue(reducedMotion ? 1 : 0);
  const hero = useSharedValue(reducedMotion ? 1 : 0);
  const speech = useSharedValue(reducedMotion ? 1 : 0);
  const subtitle = useSharedValue(reducedMotion ? 1 : 0);
  const button = useSharedValue(reducedMotion ? 1 : 0);
  const [animatedReady, setAnimatedReady] = useState<Record<EntrancePart, boolean>>(
    reducedMotion ? SHOWN : HIDDEN,
  );
  const ready = reducedMotion ? SHOWN : animatedReady;

  useEffect(() => {
    if (reducedMotion) {
      headline.value = 1;
      hero.value = 1;
      speech.value = 1;
      subtitle.value = 1;
      button.value = 1;
      return;
    }

    const values = { headline, hero, speech, subtitle, button };
    (Object.keys(DELAY) as EntrancePart[]).forEach((part) => {
      values[part].value = withDelay(DELAY[part], withTiming(1, FADE));
    });

    const timers = (Object.keys(DELAY) as EntrancePart[]).map((part) =>
      setTimeout(() => {
        setAnimatedReady((current) => ({ ...current, [part]: true }));
      }, DELAY[part]),
    );

    return () => {
      timers.forEach(clearTimeout);
      (Object.keys(values) as EntrancePart[]).forEach((part) => {
        cancelAnimation(values[part]);
        values[part].value = 0;
      });
    };
  }, [button, headline, hero, reducedMotion, speech, subtitle]);

  const headlineStyle = useAnimatedStyle(() => ({ opacity: headline.value }));
  const heroStyle = useAnimatedStyle(() => ({ opacity: hero.value }));
  const speechStyle = useAnimatedStyle(() => ({ opacity: speech.value }));
  const subtitleStyle = useAnimatedStyle(() => ({ opacity: subtitle.value }));
  const buttonStyle = useAnimatedStyle(() => ({ opacity: button.value }));

  return {
    headline: {
      style: headlineStyle,
      pointerEvents: ready.headline ? ('auto' as const) : ('none' as const),
    },
    hero: {
      style: heroStyle,
      pointerEvents: ready.hero ? ('auto' as const) : ('none' as const),
    },
    speech: {
      style: speechStyle,
      pointerEvents: ready.speech ? ('auto' as const) : ('none' as const),
    },
    subtitle: {
      style: subtitleStyle,
      pointerEvents: ready.subtitle ? ('auto' as const) : ('none' as const),
    },
    button: {
      style: buttonStyle,
      pointerEvents: ready.button ? ('auto' as const) : ('none' as const),
    },
  };
}
