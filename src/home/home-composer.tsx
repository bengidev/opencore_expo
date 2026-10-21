import { router } from 'expo-router';
import { GlassContainer } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { AppBorderBeam } from '@/components/app-border-beam';
import { AppIcon } from '@/components/app-icon';
import { useIosLiquidGlass } from '@/components/liquid-glass-view';
import { Typography } from '@/constants/typography';
import { BoxShadow, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { QUICK_ACTIONS, type ComposerActionItem } from '@/home/composer-actions';
import { ComposerActionsPopover } from '@/home/composer-actions-popover';
import { ComposerModelMenu } from '@/home/composer-model-menu';
import { ComposerSendButton } from '@/home/composer-send-button';
import { DEFAULT_HOME_MODEL_ID, HOME_MODELS } from '@/home/home-models';
import { useFontFamily } from '@/hooks/use-font-family';
import { useTheme } from '@/hooks/use-theme';

type HomeComposerProps = {
  draft: string;
  onChangeDraft: (value: string) => void;
  onSubmit: (message: string) => void;
};

export function HomeComposer({ draft, onChangeDraft, onSubmit }: HomeComposerProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const cardShadow = colorScheme === 'dark' ? BoxShadow.cardDark : BoxShadow.card;
  const reducedMotion = useReducedMotion();
  const sans = useFontFamily('sans');
  const [modelId, setModelId] = useState(DEFAULT_HOME_MODEL_ID);
  const trimmed = draft.trim();
  const iosGlass = useIosLiquidGlass();

  function handleModelSelect(id: string) {
    setModelId(id);
    void Haptics.selectionAsync().catch(() => {});
  }

  function handleActionSelect(item: ComposerActionItem) {
    switch (item.id) {
      case 'action:camera':
      case 'action:gallery':
      case 'action:files':
        void Haptics.selectionAsync().catch(() => {});
        Alert.alert(item.title, `${item.title} will be available soon.`);
        return;
      case 'action:clear-input':
        onChangeDraft('');
        return;
      case 'action:new-chat':
        router.push('/chat');
        return;
      default:
        return;
    }
  }

  function handleSend() {
    if (!trimmed) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onSubmit(trimmed);
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
          <ComposerModelMenu
            models={HOME_MODELS}
            selectedId={modelId}
            variant="glass"
            onSelect={handleModelSelect}
          />
          <View style={styles.toolbarSpacer} />
          <ComposerActionsPopover items={QUICK_ACTIONS} variant="glass" onSelect={handleActionSelect} />
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
          <ComposerModelMenu
            models={HOME_MODELS}
            selectedId={modelId}
            variant="raised"
            onSelect={handleModelSelect}
          />
          <View style={styles.toolbarSpacer} />
          <ComposerActionsPopover items={QUICK_ACTIONS} variant="raised" onSelect={handleActionSelect} />
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
  toolbarSpacer: {
    flex: 1,
  },
  iconTap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
