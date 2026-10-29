import { HStack, Host, Image, Menu, Section, Text, Toggle } from '@expo/ui/swift-ui';
import {
  accessibilityHint,
  accessibilityIdentifier,
  accessibilityLabel,
  background,
  border,
  buttonStyle,
  font,
  foregroundStyle,
  frame,
  glassEffect,
  kerning,
  menuIndicator,
  menuStyle,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import { Platform, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import {
  THINKING_LEVEL_LABELS,
  type ThinkingLevel,
} from '@/super-chat/composer/chat-models';
import {
  THINKING_TRIGGER_HEIGHT,
  THINKING_TRIGGER_WIDTH,
} from '@/super-chat/composer/model-sheet-metrics';

type ThinkingLevelControlProps = {
  modelId: string;
  levels: readonly ThinkingLevel[];
  selected: ThinkingLevel;
  onSelect: (level: ThinkingLevel) => void;
};

const IOS_MAJOR_VERSION = Number.parseInt(String(Platform.Version), 10);
const GLASS_AVAILABLE = IOS_MAJOR_VERSION >= 26;

/**
 * Native iOS thinking-level menu. The trigger is a custom SwiftUI label so it
 * matches the row's other controls; on iOS 26 and later that label is a real
 * Liquid Glass capsule, on older systems it is a bordered capsule. The menu
 * itself is the system menu, with a checkmark for the current level.
 */
export function ThinkingLevelControl({
  modelId,
  levels,
  selected,
  onSelect,
}: ThinkingLevelControlProps) {
  const theme = useTheme();

  const labelModifiers = [
    frame({ width: THINKING_TRIGGER_WIDTH, height: THINKING_TRIGGER_HEIGHT }),
    ...(GLASS_AVAILABLE
      ? [
          glassEffect({
            glass: { variant: 'regular', interactive: true },
            shape: 'capsule',
          }),
        ]
      : [
          background(theme.surfaceRaised, shapes.capsule()),
          border({ content: theme.borderVisible, width: 1 }),
        ]),
  ];

  return (
    <View style={styles.slot} testID={`model-thinking-${modelId}`}>
      <Host matchContents>
        <Menu
          label={
            <HStack spacing={4} alignment="center" modifiers={labelModifiers}>
              <Text
                modifiers={[
                  font({ size: 10, weight: 'semibold', design: 'monospaced' }),
                  kerning(0.8),
                  foregroundStyle(theme.textSecondary),
                ]}>
                {THINKING_LEVEL_LABELS[selected].toUpperCase()}
              </Text>
              <Image systemName="chevron.down" size={9} color={theme.textSecondary} />
            </HStack>
          }
          modifiers={[
            menuStyle('button'),
            menuIndicator('hidden'),
            buttonStyle('plain'),
            accessibilityLabel(`Thinking level, ${THINKING_LEVEL_LABELS[selected]}`),
            accessibilityHint('Opens the thinking level menu'),
            accessibilityIdentifier(`model-thinking-${modelId}`),
          ]}>
          <Section title="Thinking level">
            {levels.map((level) => (
              <Toggle
                key={level}
                label={THINKING_LEVEL_LABELS[level]}
                isOn={selected === level}
                onIsOnChange={(isOn) => {
                  if (isOn) onSelect(level);
                }}
              />
            ))}
          </Section>
        </Menu>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    width: THINKING_TRIGGER_WIDTH,
    height: THINKING_TRIGGER_HEIGHT,
  },
});
