import { useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, type ImageSourcePropType } from 'react-native';

import {
  Column,
  Host,
  Icon,
  ListItem,
  ModalBottomSheet,
  OutlinedTextField,
  Text,
} from '@expo/ui/jetpack-compose';
import { clickable, fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';

import { useMaterialTheme } from '@/hooks/use-material-theme';
import { useTheme } from '@/hooks/use-theme';
import {
  filterComposerActions,
  type ComposerActionItem,
} from '@/super-chat/composer/composer-actions';
import {
  ComposerActionsTrigger,
  type ComposerControlVariant,
} from '@/super-chat/composer/composer-actions-trigger';

const ANDROID_ICONS: Record<string, ImageSourcePropType> = {
  auto_awesome_mosaic: require('@expo/material-symbols/auto_awesome_mosaic.xml'),
  search: require('@expo/material-symbols/search.xml'),
  bolt: require('@expo/material-symbols/bolt.xml'),
  psychology: require('@expo/material-symbols/psychology.xml'),
  camera: require('@expo/material-symbols/camera.xml'),
  photo_library: require('@expo/material-symbols/photo_library.xml'),
  folder: require('@expo/material-symbols/folder.xml'),
  close: require('@expo/material-symbols/close.xml'),
  stop: require('@expo/material-symbols/stop_circle.xml'),
  chat_bubble: require('@expo/material-symbols/chat_bubble.xml'),
};

type ComposerActionsPopoverProps = {
  items: readonly ComposerActionItem[];
  variant?: ComposerControlVariant;
  onSelect: (item: ComposerActionItem) => void;
};

/**
 * Native Android popup: a Material 3 `ModalBottomSheet` whose content is Material
 * components end to end — an `OutlinedTextField` for the search and `ListItem`
 * rows. Nothing here is a hand-drawn surface: the sheet, the field outline and
 * the list item metrics all come from the platform theme, wearing the app
 * palette's colours rather than Material You's.
 */
export function ComposerActionsPopover({
  items,
  variant,
  onSelect,
}: ComposerActionsPopoverProps) {
  const theme = useTheme();
  const material = useMaterialTheme();
  const { width } = useWindowDimensions();
  const [isVisible, setIsVisible] = useState(false);
  const [query, setQuery] = useState('');
  const visibleItems = useMemo(() => filterComposerActions(items, query), [items, query]);

  function dismiss() {
    setIsVisible(false);
    setQuery('');
  }

  function handleSelect(item: ComposerActionItem) {
    dismiss();
    onSelect(item);
  }

  return (
    <>
      <ComposerActionsTrigger variant={variant} onPress={() => setIsVisible(true)} />
      {isVisible ? (
        <Host
          colorScheme={material.colorScheme}
          colorOverrides={material.colorOverrides}
          style={[styles.host, { width }]}>
          <ModalBottomSheet
            onDismissRequest={dismiss}
            showDragHandle
            skipPartiallyExpanded
            containerColor={theme.surface}
            contentColor={theme.text}>
            <Column
              verticalArrangement={{ spacedBy: 0 }}
              modifiers={[padding(16, 8, 16, 16), fillMaxWidth()]}>
              <OutlinedTextField
                onValueChange={setQuery}
                singleLine
                colors={{
                  focusedContainerColor: theme.surfaceRaised,
                  unfocusedContainerColor: theme.surfaceRaised,
                  focusedTextColor: theme.text,
                  unfocusedTextColor: theme.text,
                  cursorColor: theme.text,
                  focusedIndicatorColor: theme.border,
                  unfocusedIndicatorColor: theme.border,
                  focusedLeadingIconColor: theme.textSecondary,
                  unfocusedLeadingIconColor: theme.textSecondary,
                  focusedPlaceholderColor: theme.textDisabled,
                  unfocusedPlaceholderColor: theme.textDisabled,
                }}
                modifiers={[fillMaxWidth()]}>
                <OutlinedTextField.LeadingIcon>
                  <Icon source={ANDROID_ICONS.search} size={20} />
                </OutlinedTextField.LeadingIcon>
                <OutlinedTextField.Placeholder>
                  <Text color={theme.textDisabled}>Search actions</Text>
                </OutlinedTextField.Placeholder>
              </OutlinedTextField>
              {visibleItems.map((item) => (
                <ListItem
                  key={item.id}
                  colors={{
                    containerColor: 'transparent',
                    contentColor: theme.text,
                    supportingContentColor: theme.textSecondary,
                    leadingContentColor: theme.textSecondary,
                  }}
                  modifiers={[fillMaxWidth(), clickable(() => handleSelect(item))]}>
                  <ListItem.LeadingContent>
                    <Icon source={ANDROID_ICONS[item.androidIcon]} size={22} />
                  </ListItem.LeadingContent>
                  <ListItem.HeadlineContent>
                    <Text color={theme.text} style={{ fontSize: 15, fontWeight: '500' }}>
                      {item.title}
                    </Text>
                  </ListItem.HeadlineContent>
                  {item.subtitle ? (
                    <ListItem.SupportingContent>
                      <Text color={theme.textSecondary} style={{ fontSize: 13 }}>
                        {item.subtitle}
                      </Text>
                    </ListItem.SupportingContent>
                  ) : null}
                </ListItem>
              ))}
            </Column>
          </ModalBottomSheet>
        </Host>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  /**
   * The sheet is a modal window of its own, so the host only needs to hand it a
   * real width — `matchContents` measured the content intrinsically, which left
   * `fillMaxWidth` with no constraint and collapsed the content to ~60% of the
   * sheet.
   */
  host: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
});
