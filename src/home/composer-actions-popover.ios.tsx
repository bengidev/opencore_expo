import { useMemo, useRef, useState } from 'react';

import {
  Button,
  Divider,
  HStack,
  Host,
  Image,
  Popover,
  RNHostView,
  Text,
  TextField,
  type TextFieldRef,
  VStack,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  font,
  foregroundStyle,
  frame,
  glassEffect,
  padding,
} from '@expo/ui/swift-ui/modifiers';

import { useTheme } from '@/hooks/use-theme';
import {
  filterComposerActionGroups,
  type ComposerActionGroup,
  type ComposerActionItem,
} from '@/home/composer-actions';
import {
  ComposerActionsTrigger,
  type ComposerControlVariant,
} from '@/home/composer-actions-trigger';

type ComposerActionsPopoverProps = {
  groups: readonly ComposerActionGroup[];
  variant: ComposerControlVariant;
  onSelect: (item: ComposerActionItem) => void;
};

/**
 * Native iOS popup: a SwiftUI `Popover` anchored to the composer trigger, with a
 * native `TextField` as the search bar and `Divider` between the groups. The
 * panel itself carries the liquid glass effect (no-op below iOS 26).
 */
export function ComposerActionsPopover({
  groups,
  variant,
  onSelect,
}: ComposerActionsPopoverProps) {
  const theme = useTheme();
  const [isPresented, setIsPresented] = useState(false);
  const [query, setQuery] = useState('');
  const fieldRef = useRef<TextFieldRef>(null);
  const visibleGroups = useMemo(() => filterComposerActionGroups(groups, query), [groups, query]);

  function dismiss() {
    void fieldRef.current?.clear();
    setIsPresented(false);
    setQuery('');
  }

  function handleSelect(item: ComposerActionItem) {
    dismiss();
    onSelect(item);
  }

  return (
    <Host matchContents>
      <Popover
        isPresented={isPresented}
        onIsPresentedChange={(presented) => {
          if (presented) setIsPresented(true);
          else dismiss();
        }}
        attachmentAnchor="top">
        <Popover.Trigger>
          <RNHostView matchContents>
            <ComposerActionsTrigger variant={variant} onPress={() => setIsPresented(true)} />
          </RNHostView>
        </Popover.Trigger>
        <Popover.Content>
          <VStack
            spacing={10}
            modifiers={[
              padding({ all: 14 }),
              frame({ width: 280 }),
              glassEffect({
                glass: { variant: 'regular', interactive: false },
                shape: 'roundedRectangle',
                cornerRadius: 22,
              }),
            ]}>
            <HStack spacing={8}>
              <Image systemName="magnifyingglass" size={15} color={theme.textSecondary} />
              <TextField
                ref={fieldRef}
                placeholder="Search actions"
                onTextChange={setQuery}
              />
            </HStack>
            {visibleGroups.map((group, groupIndex) => (
              <VStack key={group.id} spacing={6} alignment="leading">
                {groupIndex > 0 ? <Divider /> : null}
                <Text
                  modifiers={[
                    font({ size: 12, weight: 'semibold' }),
                    foregroundStyle(theme.textSecondary),
                  ]}>
                  {group.title}
                </Text>
                {group.items.map((item) => (
                  <Button
                    key={item.id}
                    onPress={() => handleSelect(item)}
                    modifiers={[buttonStyle('plain')]}>
                    <HStack spacing={10}>
                      <Image systemName={item.iosSymbol} size={18} color={theme.textDisplay} />
                      <VStack alignment="leading" spacing={2}>
                        <Text modifiers={[font({ size: 15, weight: 'medium' })]}>{item.title}</Text>
                        {item.subtitle ? (
                          <Text
                            modifiers={[font({ size: 12 }), foregroundStyle(theme.textSecondary)]}>
                            {item.subtitle}
                          </Text>
                        ) : null}
                      </VStack>
                    </HStack>
                  </Button>
                ))}
              </VStack>
            ))}
          </VStack>
        </Popover.Content>
      </Popover>
    </Host>
  );
}
