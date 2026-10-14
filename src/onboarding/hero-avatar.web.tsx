import { useEffect, useRef } from 'react';
import { BotAvatar } from 'bot-avatars';
import { useReducedMotion } from 'react-native-reanimated';

import { ONBOARDING_HERO_BOT, type OnboardingHeroAvatarProps } from '@/onboarding/hero-bot';

export function OnboardingHeroAvatar({ size, color, ink, variant, motionLocked, motionRevision, onTap }: OnboardingHeroAvatarProps) {
  const reducedMotion = useReducedMotion();
  const avatar = useRef<HTMLCanvasElement | null>(null);
  const suppressAutomaticClick = useRef(false);

  useEffect(() => {
    if (motionRevision === 0 || !avatar.current) return;
    suppressAutomaticClick.current = true;
    avatar.current.click();
    suppressAutomaticClick.current = false;
  }, [motionRevision]);

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
