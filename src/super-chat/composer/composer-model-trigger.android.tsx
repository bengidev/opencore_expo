import { type ImageSourcePropType } from 'react-native';

import { FilledTonalButton, Host, Icon, Row, Text, TextButton } from '@expo/ui/jetpack-compose';

import { useMaterialTheme } from '@/hooks/use-material-theme';
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
  variant?: ComposerControlVariant;
  onPress: () => void;
};

/**
 * Native Android trigger: a Material 3 tonal button with the selected model's
 * Material Symbol. The container, the shape, the ripple and the content colour
 * all come from the button, so it matches every other Material control.
 */
export function ComposerModelTrigger({ model, variant, onPress }: ComposerModelTriggerProps) {
  const theme = useTheme();
  const material = useMaterialTheme();

  if (variant === 'plain') {
    return (
      <Host
        matchContents
        colorScheme={material.colorScheme}
        colorOverrides={material.colorOverrides}>
        <TextButton
          onClick={onPress}
          colors={{ contentColor: theme.text }}
          contentPadding={{ start: 10, top: 4, end: 10, bottom: 4 }}>
          <Row horizontalArrangement={{ spacedBy: 6 }} verticalAlignment="center">
            <Icon source={MODEL_ICONS[model.androidIcon]} size={16} tint={theme.text} />
            <Text color={theme.text} style={{ fontSize: 14, fontWeight: '500' }}>
              {model.name}
            </Text>
          </Row>
        </TextButton>
      </Host>
    );
  }

  return (
    <Host
      matchContents
      colorScheme={material.colorScheme}
      colorOverrides={material.colorOverrides}>
      <FilledTonalButton
        onClick={onPress}
        colors={{ containerColor: theme.surfaceRaised, contentColor: theme.text }}
        contentPadding={{ start: 14, top: 4, end: 14, bottom: 4 }}>
        <Row horizontalArrangement={{ spacedBy: 6 }} verticalAlignment="center">
          <Icon source={MODEL_ICONS[model.androidIcon]} size={16} tint={theme.text} />
          <Text color={theme.text} style={{ fontSize: 14, fontWeight: '500' }}>
            {model.name}
          </Text>
        </Row>
      </FilledTonalButton>
    </Host>
  );
}
