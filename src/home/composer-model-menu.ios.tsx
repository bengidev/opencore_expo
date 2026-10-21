import { Host, HStack, Image, Menu, Text, Toggle } from '@expo/ui/swift-ui';
import { buttonStyle, font, menuStyle } from '@expo/ui/swift-ui/modifiers';

import { useTheme } from '@/hooks/use-theme';
import type { ComposerControlVariant } from '@/home/composer-actions-trigger';
import type { HomeModel } from '@/home/home-models';

type ComposerModelMenuProps = {
  models: readonly HomeModel[];
  selectedId: string;
  variant: ComposerControlVariant;
  onSelect: (id: string) => void;
};

/**
 * Native iOS model picker: a SwiftUI `Menu` whose trigger is a real system
 * button. On iOS 26 the trigger uses the Liquid Glass button style, older
 * systems fall back to the bordered style. The items are `Toggle`s so the
 * current model gets the native checkmark.
 */
export function ComposerModelMenu({
  models,
  selectedId,
  variant,
  onSelect,
}: ComposerModelMenuProps) {
  const theme = useTheme();
  const selected = models.find((model) => model.id === selectedId) ?? models[0];

  return (
    <Host matchContents>
      <Menu
        label={
          <HStack spacing={4}>
            <Image systemName={selected.iosSymbol} size={15} color={theme.text} />
            <Text modifiers={[font({ size: 15, weight: 'medium' })]}>{selected.name}</Text>
            <Image systemName="chevron.down" size={12} color={theme.textSecondary} />
          </HStack>
        }
        modifiers={[
          buttonStyle(variant === 'glass' ? 'glass' : 'bordered'),
          menuStyle('button'),
        ]}>
        {/*
          The SwiftUI `Menu` mounts its React children in reverse order, so the
          models are reversed here to keep the list running from OpenCore to Deep.
        */}
        {[...models].reverse().map((model) => (
          <Toggle
            key={model.id}
            isOn={model.id === selectedId}
            label={model.name}
            systemImage={model.iosSymbol}
            onIsOnChange={(isOn) => {
              if (isOn) onSelect(model.id);
            }}
          />
        ))}
      </Menu>
    </Host>
  );
}
