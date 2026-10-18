import { Alert, Pressable } from 'react-native';

import {
  ATTACHMENT_ITEMS,
  AttachmentTrigger,
  attachmentMenuStyles,
  type ComposerAttachmentMenuProps,
  openAttachmentAlert,
} from '@/home/composer-attachment-menu-shared';

function showAttachmentMenu() {
  Alert.alert(
    'Add attachment',
    undefined,
    [
      ...ATTACHMENT_ITEMS.map((item) => ({
        text: item.title,
        onPress: () => openAttachmentAlert(item.id),
      })),
      { text: 'Cancel', style: 'cancel' },
    ],
  );
}

export function ComposerAttachmentMenu({ variant }: ComposerAttachmentMenuProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add attachment"
      onPress={showAttachmentMenu}
      style={attachmentMenuStyles.slot}>
      <AttachmentTrigger variant={variant} />
    </Pressable>
  );
}
