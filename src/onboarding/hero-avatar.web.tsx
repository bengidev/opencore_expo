import { useEffect, useRef } from 'react';
import { BotAvatar } from 'bot-avatars';
import { useReducedMotion } from 'react-native-reanimated';

import { ONBOARDING_HERO_BOT, type OnboardingHeroAvatarProps } from '@/onboarding/hero-bot';

export function OnboardingHeroAvatar({ size, color, ink, variant, motionLocked, motionRevision, motionEnabled, onTap }: OnboardingHeroAvatarProps) {
  const reducedMotion = useReducedMotion();
  const avatar = useRef<HTMLCanvasElement | null>(null);
  const suppressAutomaticClick = useRef(false);
  const lastMotionRevision = useRef(motionRevision);

  useEffect(() => {
    if (motionRevision === lastMotionRevision.current) return;
    lastMotionRevision.current = motionRevision;
    if (!motionEnabled || motionRevision === 0 || !avatar.current) return;
    suppressAutomaticClick.current = true;
    avatar.current.click();
    suppressAutomaticClick.current = false;
  }, [motionEnabled, motionRevision]);

  return (
    <BotAvatar
      ref={avatar}
      {...ONBOARDING_HERO_BOT}
      {...variant}
      paused={reducedMotion ?? ONBOARDING_HERO_BOT.paused}
      size={size}
      color={color}
      ink={ink}
      interactive={ONBOARDING_HERO_BOT.interactive && !motionLocked}
      onClick={() => {
        if (suppressAutomaticClick.current) return;
        onTap();
      }}
    />
  );
}
