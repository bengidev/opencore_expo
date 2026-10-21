import { useState } from 'react';
import { type ImageSourcePropType } from 'react-native';

import {
  DropdownMenu,
  DropdownMenuItem,
  Host,
  Icon,
  Row,
  Text,
} from '@expo/ui/jetpack-compose';
import {
  background,
  border,
  clickable,
  cornerRadius,
  padding,
} from '@expo/ui/jetpack-compose/modifiers';

import { useTheme } from '@/hooks/use-theme';
import type { ComposerControlVariant } from '@/home/composer-actions-trigger';
import type { HomeModel } from '@/home/home-models';

const CHECK_ICON = require('@expo/material-symbols/check.xml') as ImageSourcePropType;

const MODEL_ICONS: Record<HomeModel['androidIcon'], ImageSourcePropType> = {
  auto_awesome_mosaic: require('@expo/material-symbols/auto_awesome_mosaic.xml'),
  bolt: require('@expo/material-symbols/bolt.xml'),
  psychology: require('@expo/material-symbols/psychology.xml'),
};

type ComposerModelMenuProps = {
  models: readonly HomeModel[];
  selectedId: string;
  variant: ComposerControlVariant;
  onSelect: (id: string) => void;
};

/**
 * Native Android model picker: a Material 3 `DropdownMenu` anchored to a
 * clickable trigger. The selected model is marked with the system check icon.
 */
export function ComposerModelMenu({
  models,
  selectedId,
  variant,
  onSelect,
}: ComposerModelMenuProps) {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const selected = models.find((model) => model.id === selectedId) ?? models[0];

  function dismiss() {
    setIsExpanded(false);
  }

  function handleSelect(id: string) {
    dismiss();
    onSelect(id);
  }

  return (
    <Host matchContents>
      <DropdownMenu expanded={isExpanded} onDismissRequest={dismiss}>
        <DropdownMenu.Trigger>
          <Row
            horizontalArrangement={{ spacedBy: 6 }}
            verticalAlignment="center"
            modifiers={[
              clickable(() => setIsExpanded(true)),
              padding(12, 8, 12, 8),
              cornerRadius(18),
              background(variant === 'glass' ? theme.surface : theme.surfaceRaised),
              border(1, theme.borderVisible),
            ]}>
            <Icon source={MODEL_ICONS[selected.androidIcon]} size={16} tint={theme.text} />
            <Text color={theme.text} style={{ fontSize: 15, fontWeight: '500' }}>
              {selected.name}
            </Text>
          </Row>
        </DropdownMenu.Trigger>
        <DropdownMenu.Items>
          {models.map((model) => (
            <DropdownMenuItem key={model.id} onClick={() => handleSelect(model.id)}>
              <DropdownMenuItem.LeadingIcon>
                <Icon source={MODEL_ICONS[model.androidIcon]} size={20} tint={theme.text} />
              </DropdownMenuItem.LeadingIcon>
              <DropdownMenuItem.Text>
                <Text color={theme.text} style={{ fontSize: 15, fontWeight: '500' }}>
                  {model.name}
                </Text>
              </DropdownMenuItem.Text>
              {model.id === selectedId ? (
                <DropdownMenuItem.TrailingIcon>
                  <Icon source={CHECK_ICON} size={18} tint={theme.text} />
                </DropdownMenuItem.TrailingIcon>
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenu.Items>
      </DropdownMenu>
    </Host>
  );
}
