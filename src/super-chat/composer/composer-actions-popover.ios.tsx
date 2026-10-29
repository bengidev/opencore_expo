import { useMemo, useRef, useState } from 'react';
import { View, type ViewStyle } from 'react-native';

import {
  Button,
  ContentUnavailableView,
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
  padding,
  textFieldStyle,
} from '@expo/ui/swift-ui/modifiers';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import {
  filterComposerActions,
  type ComposerActionItem,
} from '@/super-chat/composer/composer-actions';
import {
  ComposerActionsTrigger,
  type ComposerControlVariant,
} from '@/super-chat/composer/composer-actions-trigger';

type ComposerActionsPopoverProps = {
  items: readonly ComposerActionItem[];
  variant: ComposerControlVariant;
  onSelect: (item: ComposerActionItem) => void;
};

const CONTENT_WIDTH = 280;

/**
 * The system popover glues its tail to the top edge of the trigger's measured
 * bounds. Padding the SwiftUI trigger grows those bounds, so the tail stops an
 * inset short of the button. The button sits in a fixed 36pt slot and the host
 * is pulled out of that slot by the same inset, so the toolbar layout and the
 * button's position never move.
 */
const ANCHOR_INSET = 8;
const TRIGGER_SIZE = 36;

const styles = {
  slot: { width: TRIGGER_SIZE, height: TRIGGER_SIZE },
  host: { position: 'absolute', left: -ANCHOR_INSET, top: -ANCHOR_INSET },
} satisfies Record<string, ViewStyle>;

/**
 * The actions menu is a SwiftUI `Popover`, so the panel, the material, the
 * placement and the dismissal are the system's.
 */
export function ComposerActionsPopover({
  items,
  variant,
  onSelect,
}: ComposerActionsPopoverProps) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const [isPresented, setIsPresented] = useState(false);
  const [query, setQuery] = useState('');
  const fieldRef = useRef<TextFieldRef>(null);
  const visibleItems = useMemo(() => filterComposerActions(items, query), [items, query]);

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
    <View style={styles.slot}>
      <Host
        matchContents
        style={styles.host}
        colorScheme={scheme === 'dark' ? 'dark' : 'light'}
        seedColor={theme.interactive}>
        <Popover
          isPresented={isPresented}
          onIsPresentedChange={(presented) => {
            if (presented) setIsPresented(true);
            else dismiss();
          }}
          attachmentAnchor="top"
          arrowEdge="bottom">
          <Popover.Trigger>
            <VStack modifiers={[padding({ all: ANCHOR_INSET })]}>
              <RNHostView matchContents>
                <ComposerActionsTrigger variant={variant} onPress={() => setIsPresented(true)} />
              </RNHostView>
            </VStack>
          </Popover.Trigger>
          <Popover.Content>
            <VStack spacing={0} alignment="leading" modifiers={[frame({ width: CONTENT_WIDTH })]}>
              <HStack spacing={8} modifiers={[padding({ horizontal: 16, vertical: 12 })]}>
                <Image systemName="magnifyingglass" size={15} color={theme.textSecondary} />
                <TextField
                  ref={fieldRef}
                  placeholder="Search actions"
                  onTextChange={setQuery}
                  modifiers={[
                    textFieldStyle('plain'),
                    font({ size: 15 }),
                    foregroundStyle(theme.text),
                  ]}
                />
              </HStack>
              <Divider />
              {visibleItems.length === 0 ? (
                <ContentUnavailableView
                  title="No actions"
                  systemImage="magnifyingglass"
                  description="Try a different word."
                  modifiers={[padding({ horizontal: 16, vertical: 20 })]}
                />
              ) : (
                <VStack spacing={0} alignment="leading">
                  {visibleItems.map((item) => (
                    <Button
                      key={item.id}
                      onPress={() => handleSelect(item)}
                      modifiers={[buttonStyle('plain')]}>
                      <HStack
                        spacing={12}
                        modifiers={[
                          padding({ horizontal: 16, vertical: 10 }),
                          frame({ maxWidth: CONTENT_WIDTH, alignment: 'leading' }),
                        ]}>
                        <Image systemName={item.iosSymbol} size={18} color={theme.textDisplay} />
                        <VStack alignment="leading" spacing={1}>
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
              )}
            </VStack>
          </Popover.Content>
        </Popover>
      </Host>
    </View>
  );
}
