import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ThinkingOrb } from 'panelui-native/components/thinking-orb';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AUTO_THINKING_ORB_DETAIL,
  AUTO_THINKING_ORB_LABEL,
  THINKING_ORB_COPY,
  THINKING_ORB_STYLES,
  type ThinkingOrbPreference,
  type ThinkingOrbStyle,
} from '@/components/agent-activity/orb-style';
import {
  setThinkingOrbPreference,
  useThinkingOrbPreference,
} from '@/components/agent-activity/orb-style-store';
import { AppIcon } from '@/components/app-icon';
import { NativeSurface } from '@/components/native-surface';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const PREVIEW_SIZE = 28;
const PREVIEW_WIDTH = 56;
const CHECK_SIZE = 15;

/** Three of the six, enough to say "this one depends on the run". */
const AUTO_PREVIEW: readonly ThinkingOrbStyle[] = ['working', 'searching', 'composing'];

type OrbChoice = {
  value: ThinkingOrbPreference;
  label: string;
  detail: string;
};

const CHOICES: readonly OrbChoice[] = [
  { value: 'auto', label: AUTO_THINKING_ORB_LABEL, detail: AUTO_THINKING_ORB_DETAIL },
  ...THINKING_ORB_STYLES.map((style) => ({
    value: style,
    label: THINKING_ORB_COPY[style].label,
    detail: THINKING_ORB_COPY[style].detail,
  })),
];

export function ThinkingOrbScreen() {
  const preference = useThinkingOrbPreference();
  const insets = useSafeAreaInsets();

  function choose(value: ThinkingOrbPreference) {
    void Haptics.selectionAsync().catch(() => {});
    setThinkingOrbPreference(value);
    // The picker is a modal over Settings, so closing it is also the
    // confirmation: the row behind it already shows the new value.
    router.back();
  }

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, Spacing.four) },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.column}>
          <NativeSurface
            tone="glass"
            style={styles.card}
            accessibilityRole="radiogroup"
            accessibilityLabel="Thinking orb style">
            {CHOICES.map((choice, index) => (
              <OrbRow
                key={choice.value}
                choice={choice}
                selected={choice.value === preference}
                divider={index < CHOICES.length - 1}
                onPress={() => choose(choice.value)}
              />
            ))}
          </NativeSurface>

          <ThemedText variant="caption" themeColor="textSecondary" style={styles.footnote}>
            The orb sits beside the thinking label while the model works. Auto follows what the run
            is doing; a fixed orb is used for every run.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function OrbRow({
  choice,
  selected,
  divider,
  onPress,
}: {
  choice: OrbChoice;
  selected: boolean;
  divider: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <View>
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={choice.label}
        accessibilityHint={choice.detail}
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
        <View
          style={styles.preview}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants">
          {choice.value === 'auto' ? (
            <View style={styles.autoPreview}>
              {AUTO_PREVIEW.map((style) => (
                <ThinkingOrb key={style} state={style} size={16} color={theme.text} />
              ))}
            </View>
          ) : (
            <ThinkingOrb state={choice.value} size={PREVIEW_SIZE} color={theme.text} />
          )}
        </View>

        <View style={styles.rowText}>
          <ThemedText variant="body" themeColor="text">
            {choice.label}
          </ThemedText>
          <ThemedText variant="caption" themeColor="textSecondary" numberOfLines={1}>
            {choice.detail}
          </ThemedText>
        </View>

        <AppIcon
          ios="checkmark"
          android="check"
          size={CHECK_SIZE}
          color={theme.text}
          style={selected ? undefined : styles.checkHidden}
        />
      </Pressable>

      {divider ? (
        <View
          style={[
            styles.divider,
            { backgroundColor: theme.border, marginLeft: Spacing.three + PREVIEW_WIDTH + Spacing.two },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.four,
    alignItems: 'center',
  },
  column: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
  },
  card: {
    overflow: 'hidden',
    borderRadius: Radius.card,
  },
  row: {
    minHeight: 64,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  rowPressed: {
    opacity: 0.55,
  },
  preview: {
    width: PREVIEW_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
  },
  rowText: {
    flex: 1,
    gap: Spacing.half,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  checkHidden: {
    opacity: 0,
  },
  footnote: {
    paddingHorizontal: Spacing.three,
  },
});
