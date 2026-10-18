import { GlassContainer } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { AppBorderBeam } from '@/components/app-border-beam';
import { AppIcon } from '@/components/app-icon';
import { LiquidGlassView, useIosLiquidGlass } from '@/components/liquid-glass-view';
import { ThemedText } from '@/components/themed-text';
import { Typography } from '@/constants/typography';
import { BoxShadow, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ComposerAttachmentMenu } from '@/home/composer-attachment-menu';
import { ComposerSendButton } from '@/home/composer-send-button';
import { HOME_MODELS } from '@/home/home-content';
import { useFontFamily } from '@/hooks/use-font-family';
import { useTheme } from '@/hooks/use-theme';

type HomeComposerProps = {
  draft: string;
  onChangeDraft: (value: string) => void;
  onSubmit: () => void;
};

export function HomeComposer({ draft, onChangeDraft, onSubmit }: HomeComposerProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const cardShadow = colorScheme === 'dark' ? BoxShadow.cardDark : BoxShadow.card;
  const reducedMotion = useReducedMotion();
  const sans = useFontFamily('sans');
  const [modelIndex, setModelIndex] = useState(0);
  const trimmed = draft.trim();
  const modelLabel = HOME_MODELS[modelIndex] ?? HOME_MODELS[0];
  const iosGlass = useIosLiquidGlass();

  function cycleModel() {
    setModelIndex((current) => (current + 1) % HOME_MODELS.length);
    void Haptics.selectionAsync().catch(() => {});
  }

  function handleSend() {
    if (!trimmed) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onSubmit();
  }

  return (
    <AppBorderBeam size="md" duration={1.65} active={!reducedMotion} style={styles.beamWrap}>
      <View
        style={[
          styles.shell,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            boxShadow: cardShadow,
          },
        ]}>
      <TextInput
        value={draft}
        onChangeText={onChangeDraft}
        placeholder="How can I help you today?"
        placeholderTextColor={theme.textDisabled}
        multiline
        style={[
          styles.input,
          Typography.body,
          {
            color: theme.text,
            fontFamily: sans,
          },
        ]}
        accessibilityLabel="Message"
      />
      {iosGlass ? (
        <GlassContainer spacing={Spacing.two} style={styles.toolbar}>
          <ComposerAttachmentMenu variant="glass" />
          <LiquidGlassView isInteractive style={styles.glassChip}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Model, ${modelLabel}`}
              onPress={cycleModel}
              style={({ pressed }) => [styles.glassChipHit, pressed && styles.glassPressed]}>
              <ThemedText variant="bodySm" themeColor="text">
                {modelLabel}
              </ThemedText>
              <AppIcon ios="chevron.down" android="keyboard-arrow-down" size={18} color={theme.textSecondary} />
            </Pressable>
          </LiquidGlassView>
          <View style={styles.toolbarSpacer} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voice input"
            onPress={() => void Haptics.selectionAsync().catch(() => {})}
            style={({ pressed }) => [styles.iconTap, pressed && { opacity: 0.6 }]}>
            <AppIcon ios="mic" android="mic" size={22} color={theme.textDisplay} />
          </Pressable>
          <ComposerSendButton
            enabled={Boolean(trimmed)}
            metalActive={!reducedMotion}
            onPress={handleSend}
          />
        </GlassContainer>
      ) : (
        <View style={styles.toolbar}>
          <ComposerAttachmentMenu variant="raised" />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Model, ${modelLabel}`}
            onPress={cycleModel}
            style={({ pressed }) => [
              styles.modelChip,
              { borderColor: theme.borderVisible, backgroundColor: theme.surfaceRaised },
              pressed && { opacity: 0.7 },
            ]}>
            <ThemedText variant="bodySm" themeColor="text">
              {modelLabel}
            </ThemedText>
            <AppIcon ios="chevron.down" android="keyboard-arrow-down" size={18} color={theme.textSecondary} />
          </Pressable>
          <View style={styles.toolbarSpacer} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voice input"
            onPress={() => void Haptics.selectionAsync().catch(() => {})}
            style={({ pressed }) => [styles.iconTap, pressed && { opacity: 0.6 }]}>
            <AppIcon ios="mic" android="mic" size={22} color={theme.textDisplay} />
          </Pressable>
          <ComposerSendButton
            enabled={Boolean(trimmed)}
            metalActive={!reducedMotion}
            onPress={handleSend}
          />
        </View>
      )}
      </View>
    </AppBorderBeam>
  );
}

const styles = StyleSheet.create({
  beamWrap: {
    overflow: 'visible',
    marginVertical: Spacing.one,
  },
  shell: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
    minHeight: 132,
  },
  input: {
    minHeight: 56,
    maxHeight: 120,
    padding: 0,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 40,
  },
  modelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: Spacing.two,
    height: 36,
  },
  toolbarSpacer: {
    flex: 1,
  },
  iconTap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassChip: {
    borderRadius: 18,
    height: 36,
  },
  glassChipHit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 36,
    paddingHorizontal: Spacing.two,
  },
  glassPressed: {
    opacity: 0.85,
  },
});
