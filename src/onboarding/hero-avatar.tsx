import { BotAvatar } from 'bot-avatars-native';

import { ONBOARDING_HERO_BOT, type OnboardingHeroAvatarProps } from '@/onboarding/hero-bot';

export function OnboardingHeroAvatar({ size, color, ink, variant, motionLocked, motion, onTap }: OnboardingHeroAvatarProps) {
  return (
    <BotAvatar
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
