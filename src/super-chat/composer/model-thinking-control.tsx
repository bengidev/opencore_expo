import type { ComponentRef } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
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

type TriggerFrame = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const MENU_WIDTH = 176;
const MENU_GAP = 6;
const MENU_PADDING = 6;
const MENU_HEADER_HEIGHT = 26;
const MENU_ITEM_HEIGHT = 32;
const easeOut = Easing.bezier(0.23, 1, 0.32, 1);

/**
 * Web fallback for the thinking-level control. Android and iOS use their own
 * native menus; the browser gets a small anchored menu in the app's language.
 */
export function ThinkingLevelControl({
  modelId,
  levels,
  selected,
  onSelect,
}: ThinkingLevelControlProps) {
  const theme = useTheme();
  const window = useWindowDimensions();
  const triggerRef = useRef<ComponentRef<typeof Pressable>>(null);
  const [frame, setFrame] = useState<TriggerFrame | null>(null);
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);

  const open = () => {
    triggerRef.current?.measureInWindow((left, top, width, height) => {
      setFrame({ left, top, width, height });
    });
  };

  const close = () => {
    setFrame(null);
    progress.value = 0;
  };

  useEffect(() => {
    if (!frame) return;
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: reducedMotion ? 0 : 160,
      easing: easeOut,
    });
  }, [frame, progress, reducedMotion]);

  const menuHeight = MENU_PADDING * 2 + MENU_HEADER_HEIGHT + levels.length * MENU_ITEM_HEIGHT;
  const spaceBelow = frame ? window.height - (frame.top + frame.height) : 0;
  const opensBelow = frame ? spaceBelow >= menuHeight + MENU_GAP + Spacing.two : true;

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: reducedMotion ? 1 : 0.97 + progress.value * 0.03 }],
  }));

  return (
    <>
      <Pressable
        ref={triggerRef}
        accessibilityRole="button"
        accessibilityLabel={`Thinking level, ${THINKING_LEVEL_LABELS[selected]}`}
        accessibilityHint="Opens the thinking level menu"
        testID={`model-thinking-${modelId}`}
        onPress={open}
        hitSlop={4}
        style={({ pressed }) => [
          styles.trigger,
          pressed && { opacity: 0.6 },
        ]}>
        <ThinkingLevelPill level={selected} />
      </Pressable>

      {frame ? (
        <Modal
          transparent
          visible
          animationType="none"
          onRequestClose={close}
          statusBarTranslucent>
          <Pressable
            style={styles.backdrop}
            accessibilityRole="button"
            accessibilityLabel="Close thinking level menu"
            onPress={close}
          />
          <Animated.View
            style={[
              styles.menu,
              {
                right: window.width - (frame.left + frame.width),
                ...(opensBelow
                  ? { top: frame.top + frame.height + MENU_GAP }
                  : { bottom: window.height - frame.top + MENU_GAP }),
                backgroundColor: theme.surfaceRaised,
                borderColor: theme.borderVisible,
                transformOrigin: opensBelow ? '100% 0%' : '100% 100%',
              },
              animatedStyle,
            ]}>
            <ThemedText variant="label" themeColor="textSecondary" style={styles.menuHeader}>
              Thinking level
            </ThemedText>
            {levels.map((level) => {
              const isSelected = level === selected;
              return (
                <Pressable
                  key={level}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => {
                    if (!isSelected) onSelect(level);
                    close();
                  }}
                  style={({ pressed }) => [
                    styles.item,
                    isSelected && { backgroundColor: theme.surface },
                    pressed && { opacity: 0.6 },
                  ]}>
                  <ThemedText
                    variant="bodySm"
                    themeColor={isSelected ? 'textDisplay' : 'text'}
                    face={isSelected ? 'sansMedium' : undefined}>
                    {THINKING_LEVEL_LABELS[level]}
                  </ThemedText>
                  {isSelected ? (
                    <AppIcon
                      ios="checkmark"
                      android="check"
                      size={14}
                      color={theme.textDisplay}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </Animated.View>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: THINKING_TRIGGER_WIDTH,
    height: THINKING_TRIGGER_HEIGHT,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menu: {
    position: 'absolute',
    width: MENU_WIDTH,
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: MENU_PADDING,
    gap: 1,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  menuHeader: {
    height: MENU_HEADER_HEIGHT,
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.one,
  },
  item: {
    height: MENU_ITEM_HEIGHT,
    borderRadius: Radius.compact,
    paddingHorizontal: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
