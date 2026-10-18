import * as Haptics from 'expo-haptics';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { LiquidGlassView } from '@/components/liquid-glass-view';
import { useTheme } from '@/hooks/use-theme';

export type AttachmentId = 'camera' | 'gallery' | 'files';

export const ATTACHMENT_ITEMS: {
  id: AttachmentId;
  title: string;
  iosSymbol: 'camera' | 'photo.on.rectangle' | 'folder';
  androidIcon: 'photo-camera' | 'photo-library' | 'folder';
}[] = [
  { id: 'camera', title: 'Camera', iosSymbol: 'camera', androidIcon: 'photo-camera' },
  { id: 'gallery', title: 'Gallery', iosSymbol: 'photo.on.rectangle', androidIcon: 'photo-library' },
  { id: 'files', title: 'Files', iosSymbol: 'folder', androidIcon: 'folder' },
];

export const MENU_ACTIONS = ATTACHMENT_ITEMS.map((item) => ({
  id: item.id,
  title: item.title,
  image: item.iosSymbol,
}));

export function openAttachmentAlert(id: AttachmentId) {
  const item = ATTACHMENT_ITEMS.find((entry) => entry.id === id);
  if (!item) return;
  void Haptics.selectionAsync().catch(() => {});
  Alert.alert(item.title, `${item.title} will be available soon.`);
}

export type ComposerAttachmentMenuProps = {
  variant: 'glass' | 'raised';
};

export function AttachmentTrigger({ variant }: ComposerAttachmentMenuProps) {
  const theme = useTheme();

  if (variant === 'glass') {
    return (
      <LiquidGlassView isInteractive style={attachmentMenuStyles.glassCircle}>
        <View style={attachmentMenuStyles.trigger} accessibilityLabel="Add attachment">
          <AppIcon ios="plus" android="add" size={20} color={theme.textDisplay} />
        </View>
      </LiquidGlassView>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add attachment"
      style={({ pressed }) => [
        attachmentMenuStyles.circleButton,
        { borderColor: theme.borderVisible, backgroundColor: theme.surfaceRaised },
        pressed && { opacity: 0.7 },
      ]}>
      <AppIcon ios="plus" android="add" size={20} color={theme.textDisplay} />
    </Pressable>
  );
}

export const attachmentMenuStyles = StyleSheet.create({
  slot: {
    width: 36,
    height: 36,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trigger: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
