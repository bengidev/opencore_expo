import { MenuView } from '@expo/ui/community/menu';

import {
  AttachmentTrigger,
  MENU_ACTIONS,
  attachmentMenuStyles,
  type AttachmentId,
  type ComposerAttachmentMenuProps,
  openAttachmentAlert,
} from '@/home/composer-attachment-menu-shared';

/** Default native (Android) — iOS and web use platform-specific files. */
export function ComposerAttachmentMenu({ variant }: ComposerAttachmentMenuProps) {
  return (
    <MenuView
      style={attachmentMenuStyles.slot}
      actions={MENU_ACTIONS}
      onPressAction={({ nativeEvent }) => openAttachmentAlert(nativeEvent.event as AttachmentId)}>
      <AttachmentTrigger variant={variant} />
    </MenuView>
  );
}
