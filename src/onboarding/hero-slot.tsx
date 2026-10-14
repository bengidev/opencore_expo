import { useCallback, useEffect, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { useReducedMotion, type SharedValue } from 'react-native-reanimated';

import {
  ONBOARDING_HERO_COLOR,
  ONBOARDING_HERO_INK,
  randomizeOnboardingHero,
  tapMotionDurationSeconds,
  type OnboardingHeroMotion,
} from '@/onboarding/hero-bot';
import { OnboardingHeroAvatar } from '@/onboarding/hero-avatar';
import { onboardingHeroSize } from '@/onboarding/hero-size';

/** Crisp hero whose shape and jump behavior change with each tap. */
export function OnboardingHero({
  onTap,
  motion,
  autoMotionRevision,
}: {
  onTap: () => void;
  motion: SharedValue<OnboardingHeroMotion>;
  autoMotionRevision: number;
}) {
  const { width, height } = useWindowDimensions();
  const size = onboardingHeroSize(width, height);
  const reducedMotion = useReducedMotion();
  const [variant, setVariant] = useState(() => randomizeOnboardingHero('ghost'));
  const [motionLocked, setMotionLocked] = useState(false);
  const motionLock = useRef(false);
  const lastAutoMotionRevision = useRef(autoMotionRevision);
  const unlockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (unlockTimer.current) clearTimeout(unlockTimer.current);
    },
    [],
  );

  const playMotion = useCallback(() => {
    if (motionLock.current) return;
    const next = randomizeOnboardingHero(variant.type);
    if (reducedMotion) {
      setVariant(next);
      return;
    }

    motionLock.current = true;
    setMotionLocked(true);
    unlockTimer.current = setTimeout(() => {
      setVariant(next);
      motionLock.current = false;
      setMotionLocked(false);
      unlockTimer.current = null;
    }, Math.ceil(tapMotionDurationSeconds(variant, next.speed) * 1000) + 50);
  }, [reducedMotion, variant]);

  useEffect(() => {
    if (autoMotionRevision === lastAutoMotionRevision.current) return;
    lastAutoMotionRevision.current = autoMotionRevision;
    playMotion();
  }, [autoMotionRevision, playMotion]);

  const handleTap = () => {
    if (motionLock.current) return;
    onTap();
    playMotion();
  };

  return (
    <OnboardingHeroAvatar
      size={size}
      color={ONBOARDING_HERO_COLOR}
      ink={ONBOARDING_HERO_INK}
      motion={motion}
      motionRevision={autoMotionRevision}
      motionEnabled={!reducedMotion}
      variant={variant}
      motionLocked={motionLocked}
      onTap={handleTap}
    />
  );
}
