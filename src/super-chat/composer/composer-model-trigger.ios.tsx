import { Button, HStack, Host, Image, Text } from '@expo/ui/swift-ui';
import { buttonStyle, font } from '@expo/ui/swift-ui/modifiers';

import { useTheme } from '@/hooks/use-theme';
import type { ComposerControlVariant } from '@/super-chat/composer/composer-actions-trigger';
import type { HomeModel } from '@/super-chat/composer/chat-models';

type ComposerModelTriggerProps = {
  model: HomeModel;
  variant: ComposerControlVariant;
  onPress: () => void;
};

/**
 * Native iOS trigger: a SwiftUI `Button` that opens the model sheet. On iOS 26
 * the trigger uses the Liquid Glass button style, older systems fall back to the
 * bordered style.
 */
export function ComposerModelTrigger({
  model,
  variant,
  onPress,
}: ComposerModelTriggerProps) {
  const theme = useTheme();

  return (
    <Host matchContents>
      <Button
        onPress={onPress}
        testID="composer-model-trigger"
        modifiers={[buttonStyle(variant === 'glass' ? 'glass' : 'bordered')]}>
        <HStack spacing={4} alignment="center">
          <Image systemName={model.iosSymbol} size={15} color={theme.text} />
          <Text modifiers={[font({ size: 15, weight: 'medium' })]}>{model.name}</Text>
          <Image systemName="chevron.down" size={12} color={theme.textSecondary} />
        </HStack>
      </Button>
    </Host>
  );
}
