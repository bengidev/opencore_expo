import * as Haptics from 'expo-haptics';
import { type ReactNode, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { AppBorderBeam } from '@/components/app-border-beam';
import { AppIcon } from '@/components/app-icon';
import { NativeSurface } from '@/components/native-surface';
import { Radius, Spacing } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { useFontFamily } from '@/hooks/use-font-family';
import { useTheme } from '@/hooks/use-theme';
import { hasNativeChrome } from '@/lib/ui-tier';
import { DEFAULT_HOME_MODEL_ID, HOME_MODEL_SHEET_ITEMS } from '@/super-chat/composer/chat-models';
import { QUICK_ACTIONS, type ComposerActionItem } from '@/super-chat/composer/composer-actions';
import { ComposerActionsPopover } from '@/super-chat/composer/composer-actions-popover';
import { ComposerModelSheet } from '@/super-chat/composer/composer-model-sheet';
import { ComposerSendButton } from '@/super-chat/composer/composer-send-button';
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
  const reducedMotion = useReducedMotion();
  const sans = useFontFamily('sans');
  const [modelId, setModelId] = useState(DEFAULT_HOME_MODEL_ID);
  const trimmed = draft.trim();

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
    <ComposerShell translucent={translucent} reducedMotion={reducedMotion}>
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
      <View style={styles.toolbar}>
        <ComposerModelSheet
          models={HOME_MODEL_SHEET_ITEMS}
          selectedId={modelId}
          onSelect={handleModelSelect}
        />
        <View style={styles.toolbarSpacer} />
        <ComposerActionsPopover items={QUICK_ACTIONS} onSelect={handleActionSelect} />
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
    </ComposerShell>
  );
}

/**
 * The composer's container. On the native tiers it is the platform's own
 * surface — Liquid Glass where the system has it, a tonal Material container on
 * Android — so the border beam that gives the custom tier its edge never runs
 * there, and the app's outline is never drawn on top of a native material.
 */
function ComposerShell({
  translucent,
  reducedMotion,
  children,
}: {
  translucent: boolean;
  reducedMotion: boolean;
  children: ReactNode;
}) {
  const shell = (
    <NativeSurface
      tone={translucent && !hasNativeChrome ? 'plain' : 'glass'}
      radius={Radius.sheet}
      materialRadius={Radius.materialSheet}
      transparent={translucent && !hasNativeChrome}
      style={styles.shell}>
      {children}
    </NativeSurface>
  );

  if (hasNativeChrome) {
    return shell;
  }

  return (
    <AppBorderBeam
      size="md"
      duration={1.65}
      active={!reducedMotion}
      borderRadius={Radius.sheet}
      style={styles.beamWrap}>
      {shell}
    </AppBorderBeam>
  );
}

const styles = StyleSheet.create({
  beamWrap: {
    overflow: 'visible',
  },
  shell: {
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
