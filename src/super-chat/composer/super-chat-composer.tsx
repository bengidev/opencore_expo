import { GlassContainer } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { AppBorderBeam } from '@/components/app-border-beam';
import { AppIcon } from '@/components/app-icon';
import { useIosLiquidGlass } from '@/components/liquid-glass-view';
import { Typography } from '@/constants/typography';
import { BoxShadow, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { QUICK_ACTIONS, type ComposerActionItem } from '@/super-chat/composer/composer-actions';
import { ComposerActionsPopover } from '@/super-chat/composer/composer-actions-popover';
import { ComposerModelSheet } from '@/super-chat/composer/composer-model-sheet';
import { ComposerSendButton } from '@/super-chat/composer/composer-send-button';
import { DEFAULT_HOME_MODEL_ID, HOME_MODEL_SHEET_ITEMS } from '@/super-chat/composer/chat-models';
import { useFontFamily } from '@/hooks/use-font-family';
import { useTheme } from '@/hooks/use-theme';
import { normalizeComposerDraft } from '@/super-chat/composer-state';

export type SuperChatComposerProps = {
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: (message: string) => void;
  onNewChat: () => void;
  translucent?: boolean;
};

export function SuperChatComposer({
  draft,
  onDraftChange,
  onSubmit,
  onNewChat,
  translucent = false,
}: SuperChatComposerProps) {
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
        onDraftChange('');
        return;
      case 'action:new-chat':
        onNewChat();
        return;
      default:
        return;
    }
  }

  function handleSend() {
    const message = normalizeComposerDraft(draft);
    if (message === null) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onSubmit(message);
  }

  return (
    <AppBorderBeam size="md" duration={1.65} active={!reducedMotion} style={styles.beamWrap}>
      <View
        style={[
          styles.shell,
          {
            backgroundColor: translucent ? 'transparent' : theme.surface,
            borderColor: translucent ? 'transparent' : theme.border,
            boxShadow: cardShadow,
          },
        ]}>
      <TextInput
        value={draft}
        onChangeText={onDraftChange}
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
          <ComposerModelSheet
            models={HOME_MODEL_SHEET_ITEMS}
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
          <ComposerModelSheet
            models={HOME_MODEL_SHEET_ITEMS}
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
  },
  shell: {
    borderWidth: 1,
    borderRadius: Radius.surface,
    borderCurve: 'continuous',
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
