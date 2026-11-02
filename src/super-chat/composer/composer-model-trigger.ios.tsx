import { Button, HStack, Host, Image, Text } from '@expo/ui/swift-ui';
import { buttonStyle, font, foregroundStyle } from '@expo/ui/swift-ui/modifiers';

import { useTheme } from '@/hooks/use-theme';
import { isIosGlass } from '@/lib/ui-tier';
import type { ComposerControlVariant } from '@/super-chat/composer/composer-actions-trigger';
import type { HomeModel } from '@/super-chat/composer/chat-models';

type ComposerModelTriggerProps = {
  model: HomeModel;
  variant?: ComposerControlVariant;
  onPress: () => void;
};

/**
 * Native iOS trigger: a SwiftUI `Button` that opens the model sheet. The
 * button style is the system's, so on iOS 26 it is a Liquid Glass chip and on
 * older systems a bordered one.
 */
export function ComposerModelTrigger({
  model,
  variant,
  onPress,
}: ComposerModelTriggerProps) {
  const theme = useTheme();
  const buttonVariant =
    variant === 'plain' ? 'plain' : isIosGlass ? 'glass' : 'bordered';

  return (
    <Host matchContents>
      <Button
        onPress={onPress}
        testID="composer-model-trigger"
        modifiers={[buttonStyle(buttonVariant)]}>
        <HStack spacing={4} alignment="center">
          <Image systemName={model.iosSymbol} size={15} color={theme.text} />
          <Text modifiers={[font({ size: 15, weight: 'medium' }), foregroundStyle(theme.text)]}>
            {model.name}
          </Text>
          <Image systemName="chevron.down" size={12} color={theme.textSecondary} />
        </HStack>
      </Button>
    </Host>
  );
}
