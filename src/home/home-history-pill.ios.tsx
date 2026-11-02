import { Button, HStack, Host, Image, Menu, Section, Text } from '@expo/ui/swift-ui';
import {
  accessibilityHint,
  accessibilityLabel,
  background,
  border,
  buttonStyle,
  disabled,
  font,
  foregroundStyle,
  glassEffect,
  menuIndicator,
  menuStyle,
  padding,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { isIosGlass } from '@/lib/ui-tier';

const PILL_HEIGHT = 32;
const PILL_WIDTH = 96;
/**
 * Native chips space their content off the capsule edge, so the label carries
 * its own padding instead of letting the icon and chevron sit flush against the
 * glass rim.
 */
const PILL_PADDING = { horizontal: 12, vertical: 6 } as const;
const PILL_CONTENT_GAP = 5;

/**
 * Native iOS history trigger: a system `Menu` whose label is the app's small
 * chip. The chip itself is Liquid Glass where the system draws glass and a
 * bordered capsule everywhere else, so the popup underneath is the real iOS
 * menu rather than a positioned React Native overlay.
 */
export function HomeHistoryPill() {
  const theme = useTheme();

  const labelModifiers = [
    padding(PILL_PADDING),
    ...(isIosGlass
      ? [glassEffect({ glass: { variant: 'regular', interactive: true }, shape: 'capsule' })]
      : [
          background(theme.surface, shapes.capsule()),
          border({ content: theme.border, width: 1 }),
        ]),
  ];

  return (
    <View style={styles.slot}>
      <Host matchContents>
        <Menu
          label={
            <HStack spacing={PILL_CONTENT_GAP} alignment="center" modifiers={labelModifiers}>
              <Image systemName="clock" size={12} color={theme.textSecondary} />
              <Text
                modifiers={[
                  font({ size: 13, weight: 'medium' }),
                  foregroundStyle(theme.textSecondary),
                ]}>
                History
              </Text>
              <Image systemName="chevron.down" size={10} color={theme.textSecondary} />
            </HStack>
          }
          modifiers={[
            menuStyle('button'),
            menuIndicator('hidden'),
            buttonStyle('plain'),
            accessibilityLabel('History'),
            accessibilityHint('Opens recent conversations'),
          ]}>
          <Section title="Recent">
            <Button
              label="No conversations yet"
              onPress={() => {}}
              modifiers={[disabled(true), foregroundStyle(theme.text)]}
            />
            <Button
              label="Start a chat and it will show up here."
              onPress={() => {}}
              modifiers={[disabled(true), font({ size: 12 }), foregroundStyle(theme.textSecondary)]}
            />
          </Section>
        </Menu>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    minHeight: PILL_HEIGHT,
    minWidth: PILL_WIDTH,
    justifyContent: 'center',
  },
});
