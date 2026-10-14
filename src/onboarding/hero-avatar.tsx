import { useEffect, useRef } from 'react';
import { BotAvatar, type BotAvatarHandle } from 'bot-avatars-native';

import { ONBOARDING_HERO_BOT, type OnboardingHeroAvatarProps } from '@/onboarding/hero-bot';

export function OnboardingHeroAvatar({ size, color, ink, variant, motionLocked, motion, motionRevision, motionEnabled, onTap }: OnboardingHeroAvatarProps) {
  const avatar = useRef<BotAvatarHandle | null>(null);
  const lastMotionRevision = useRef(motionRevision);

  useEffect(() => {
    if (motionRevision === lastMotionRevision.current) return;
    lastMotionRevision.current = motionRevision;
    if (!motionEnabled) return;
    avatar.current?.poke();
  }, [motionEnabled, motionRevision]);

  return (
    <BotAvatar
      ref={avatar}
      {...ONBOARDING_HERO_BOT}
      {...variant}
      size={size}
      color={color}
      ink={ink}
      motion={motion}
      interactive={ONBOARDING_HERO_BOT.interactive && !motionLocked}
      onPress={onTap}
      accessibilityLabel={`${variant.type} assistant avatar`}
    />
  );
}
