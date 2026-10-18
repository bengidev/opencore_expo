import { Host } from '@expo/ui';
import { Button, Menu, RNHostView } from '@expo/ui/swift-ui';
import { menuOrder } from '@expo/ui/swift-ui/modifiers';

import {
  ATTACHMENT_ITEMS,
  AttachmentTrigger,
  attachmentMenuStyles,
  type ComposerAttachmentMenuProps,
  openAttachmentAlert,
} from '@/home/composer-attachment-menu-shared';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function ComposerAttachmentMenu({ variant }: ComposerAttachmentMenuProps) {
  const scheme = useColorScheme();
  const trigger = <AttachmentTrigger variant={variant} />;

  return (
    <Host
      colorScheme={scheme === 'dark' ? 'dark' : 'light'}
      matchContents
      style={attachmentMenuStyles.slot}
      ignoreSafeArea="all">
      <Menu
        label={
          <RNHostView matchContents>
            {trigger}
          </RNHostView>
        }
        modifiers={[menuOrder('fixed')]}>
        {ATTACHMENT_ITEMS.map((item) => (
          <Button
            key={item.id}
            label={item.title}
            systemImage={item.iosSymbol}
            onPress={() => openAttachmentAlert(item.id)}
          />
        ))}
      </Menu>
    </Host>
  );
}
