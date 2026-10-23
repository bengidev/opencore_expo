import { type ImageSourcePropType } from 'react-native';

import { Host, Icon, Row, Text } from '@expo/ui/jetpack-compose';
import {
  background,
  border,
  clickable,
  cornerRadius,
  padding,
} from '@expo/ui/jetpack-compose/modifiers';

import { useTheme } from '@/hooks/use-theme';
import type { ComposerControlVariant } from '@/super-chat/composer/composer-actions-trigger';
import type { HomeModel, HomeModelAndroidIcon } from '@/super-chat/composer/chat-models';

const MODEL_ICONS: Record<HomeModelAndroidIcon, ImageSourcePropType> = {
  auto_awesome_mosaic: require('@expo/material-symbols/auto_awesome_mosaic.xml'),
  bolt: require('@expo/material-symbols/bolt.xml'),
  psychology: require('@expo/material-symbols/psychology.xml'),
  image_search: require('@expo/material-symbols/image_search.xml'),
  code: require('@expo/material-symbols/code.xml'),
  globe: require('@expo/material-symbols/globe.xml'),
  edit_note: require('@expo/material-symbols/edit_note.xml'),
  analytics: require('@expo/material-symbols/analytics.xml'),
  shield: require('@expo/material-symbols/shield.xml'),
};

type ComposerModelTriggerProps = {
  model: HomeModel;
  variant: ComposerControlVariant;
  onPress: () => void;
};

/**
 * Native Android trigger: a clickable Material row that opens the model sheet.
 * The selected model is shown with its Material Symbol.
 */
export function ComposerModelTrigger({
  model,
  variant,
  onPress,
}: ComposerModelTriggerProps) {
  const theme = useTheme();

  return (
    <Host matchContents>
      <Row
        horizontalArrangement={{ spacedBy: 6 }}
        verticalAlignment="center"
        modifiers={[
          clickable(onPress),
          padding(12, 8, 12, 8),
          cornerRadius(18),
          background(variant === 'glass' ? theme.surface : theme.surfaceRaised),
          border(1, theme.borderVisible),
        ]}>
        <Icon source={MODEL_ICONS[model.androidIcon]} size={16} tint={theme.text} />
        <Text color={theme.text} style={{ fontSize: 15, fontWeight: '500' }}>
          {model.name}
        </Text>
      </Row>
    </Host>
  );
}
