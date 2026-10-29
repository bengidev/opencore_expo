import { MenuView, type MenuAction } from '@expo/ui/community/menu';
import { StyleSheet, View } from 'react-native';

import {
  THINKING_LEVEL_LABELS,
  type ThinkingLevel,
} from '@/super-chat/composer/chat-models';
import {
  THINKING_TRIGGER_HEIGHT,
  THINKING_TRIGGER_WIDTH,
} from '@/super-chat/composer/model-sheet-metrics';
import { ThinkingLevelPill } from '@/super-chat/composer/model-thinking-pill';

type ThinkingLevelControlProps = {
  modelId: string;
  levels: readonly ThinkingLevel[];
  selected: ThinkingLevel;
  onSelect: (level: ThinkingLevel) => void;
};

/**
 * Native Android thinking-level menu: a Material dropdown anchored to the
 * trigger pill, with a trailing checkmark on the current level.
 */
export function ThinkingLevelControl({
  modelId,
  levels,
  selected,
  onSelect,
}: ThinkingLevelControlProps) {
  const actions: MenuAction[] = levels.map((level) => ({
    id: level,
    title: THINKING_LEVEL_LABELS[level],
    state: selected === level ? 'on' : 'off',
  }));

  return (
    <View style={styles.slot}>
      <MenuView
        actions={actions}
        onPressAction={({ nativeEvent }) => {
          const level = nativeEvent.event as ThinkingLevel;
          if (level !== selected) onSelect(level);
        }}
        testID={`model-thinking-${modelId}`}
        style={styles.menu}>
        <ThinkingLevelPill
          level={selected}
          accessibilityRole="button"
          accessibilityLabel={`Thinking level, ${THINKING_LEVEL_LABELS[selected]}`}
          accessibilityHint="Opens the thinking level menu"
        />
      </MenuView>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    width: THINKING_TRIGGER_WIDTH,
    height: THINKING_TRIGGER_HEIGHT,
  },
  menu: {
    width: THINKING_TRIGGER_WIDTH,
    height: THINKING_TRIGGER_HEIGHT,
  },
});
