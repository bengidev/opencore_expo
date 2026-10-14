import { BotAvatar } from 'bot-avatars';
import { useReducedMotion } from 'react-native-reanimated';

import { ONBOARDING_HERO_BOT, type OnboardingHeroAvatarProps } from '@/onboarding/hero-bot';

export function OnboardingHeroAvatar({ size, color, ink, variant, motionLocked, onTap }: OnboardingHeroAvatarProps) {
  const reducedMotion = useReducedMotion();
  return (
    <BotAvatar
      {...ONBOARDING_HERO_BOT}
      {...variant}
      paused={reducedMotion ?? ONBOARDING_HERO_BOT.paused}
      size={size}
      color={color}
      ink={ink}
      interactive={ONBOARDING_HERO_BOT.interactive && !motionLocked}
      onClick={onTap}
    />
  );
}
