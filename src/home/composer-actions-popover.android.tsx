import { useMemo, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';

import {
  Column,
  HorizontalDivider,
  Host,
  Icon,
  ListItem,
  ModalBottomSheet,
  Text,
  TextField,
} from '@expo/ui/jetpack-compose';
import { clickable, fillMaxWidth, paddingAll } from '@expo/ui/jetpack-compose/modifiers';

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

const ANDROID_ICONS: Record<string, ImageSourcePropType> = {
  auto_awesome_mosaic: require('@expo/material-symbols/auto_awesome_mosaic.xml'),
  bolt: require('@expo/material-symbols/bolt.xml'),
  psychology: require('@expo/material-symbols/psychology.xml'),
  camera: require('@expo/material-symbols/camera.xml'),
  photo_library: require('@expo/material-symbols/photo_library.xml'),
  folder: require('@expo/material-symbols/folder.xml'),
  close: require('@expo/material-symbols/close.xml'),
  chat_bubble: require('@expo/material-symbols/chat_bubble.xml'),
};

type ComposerActionsPopoverProps = {
  groups: readonly ComposerActionGroup[];
  variant: ComposerControlVariant;
  onSelect: (item: ComposerActionItem) => void;
};

/**
 * Native Android popup: a Material 3 `ModalBottomSheet` with a Material text
 * field as the search bar and a divider between the groups.
 */
export function ComposerActionsPopover({
  groups,
  variant,
  onSelect,
}: ComposerActionsPopoverProps) {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [query, setQuery] = useState('');
  const visibleGroups = useMemo(() => filterComposerActionGroups(groups, query), [groups, query]);

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
        <Host matchContents>
          <ModalBottomSheet
            onDismissRequest={dismiss}
            showDragHandle
            skipPartiallyExpanded
            contentColor={theme.text}>
            <Column
              verticalArrangement={{ spacedBy: 4 }}
              modifiers={[paddingAll(16), fillMaxWidth()]}>
              <TextField
                onValueChange={setQuery}
                singleLine>
                <TextField.Placeholder>
                  <Text color={theme.textSecondary}>Search actions</Text>
                </TextField.Placeholder>
              </TextField>
              {visibleGroups.map((group, groupIndex) => (
                <Column key={group.id} verticalArrangement={{ spacedBy: 2 }}>
                  {groupIndex > 0 ? <HorizontalDivider /> : null}
                  <Text
                    color={theme.textSecondary}
                    style={{ fontSize: 12, fontWeight: '600' }}>
                    {group.title}
                  </Text>
                  {group.items.map((item) => (
                    <ListItem
                      key={item.id}
                      modifiers={[clickable(() => handleSelect(item))]}>
                      <ListItem.LeadingContent>
                        <Icon source={ANDROID_ICONS[item.androidIcon]} size={22} />
                      </ListItem.LeadingContent>
                      <ListItem.HeadlineContent>
                        <Text style={{ fontSize: 15, fontWeight: '500' }}>{item.title}</Text>
                      </ListItem.HeadlineContent>
                      {item.subtitle ? (
                        <ListItem.SupportingContent>
                          <Text color={theme.textSecondary} style={{ fontSize: 12 }}>
                            {item.subtitle}
                          </Text>
                        </ListItem.SupportingContent>
                      ) : null}
                    </ListItem>
                  ))}
                </Column>
              ))}
            </Column>
          </ModalBottomSheet>
        </Host>
      ) : null}
    </>
  );
}
