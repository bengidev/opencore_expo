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
  clip,
  clickable,
  height,
  padding,
  Shapes,
  testID,
} from '@expo/ui/jetpack-compose/modifiers';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useMaterialTheme } from '@/hooks/use-material-theme';
import { useTheme } from '@/hooks/use-theme';

const PILL_HEIGHT = 28;

/**
 * Native Android history trigger: a tonal Material pill that opens the Compose
 * `DropdownMenu`, so the popup is a real elevated Material surface with the
 * platform's own item metrics instead of a hand-positioned React Native card.
 * The pill is a filled container — Material draws no hairline outline, so
 * neither does this.
 */
export function HomeHistoryPill() {
  const theme = useTheme();
  const material = useMaterialTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.slot}>
      <Host
        matchContents
        colorScheme={material.colorScheme}
        colorOverrides={material.colorOverrides}>
        <DropdownMenu
          expanded={open}
          onDismissRequest={() => setOpen(false)}
          color={theme.surface}
          cornerRadius={16}>
          <DropdownMenu.Trigger>
            <Row
              verticalAlignment="center"
              horizontalArrangement={{ spacedBy: 4 }}
              modifiers={[
                clip(Shapes.RoundedCorner(PILL_HEIGHT)),
                background(theme.surfaceRaised),
                height(PILL_HEIGHT),
                padding(10, 0, 10, 0),
                clickable(() => setOpen(true)),
                testID('history-trigger'),
              ]}>
              <Icon
                source={require('@expo/material-symbols/history.xml')}
                size={12}
                tint={theme.textSecondary}
              />
              <Text color={theme.textSecondary} style={{ fontSize: 12 }}>
                History
              </Text>
              <Icon
                source={require('@expo/material-symbols/keyboard_arrow_down.xml')}
                size={12}
                tint={theme.textSecondary}
              />
            </Row>
          </DropdownMenu.Trigger>
          <DropdownMenu.Items>
            <DropdownMenuItem enabled={false}>
              <DropdownMenuItem.Text>
                <Text color={theme.textSecondary} style={{ fontSize: 11, fontWeight: '700' }}>
                  RECENT
                </Text>
              </DropdownMenuItem.Text>
            </DropdownMenuItem>
            <DropdownMenuItem enabled={false}>
              <DropdownMenuItem.Text>
                <Text color={theme.text}>No conversations yet</Text>
              </DropdownMenuItem.Text>
            </DropdownMenuItem>
            <DropdownMenuItem enabled={false}>
              <DropdownMenuItem.Text>
                <Text color={theme.textSecondary} style={{ fontSize: 12 }}>
                  Start a chat and it will show up here.
                </Text>
              </DropdownMenuItem.Text>
            </DropdownMenuItem>
          </DropdownMenu.Items>
        </DropdownMenu>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    height: PILL_HEIGHT,
    minWidth: 84,
    justifyContent: 'center',
  },
});