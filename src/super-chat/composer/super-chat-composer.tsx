import * as Haptics from 'expo-haptics';
import { useMemo, type ReactNode } from 'react';
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
import type { HomeModel, ThinkingLevel } from '@/super-chat/composer/chat-models';
import {
  QUICK_ACTIONS,
  STOP_ACTION,
  type ComposerActionItem,
} from '@/super-chat/composer/composer-actions';
import { ComposerActionsPopover } from '@/super-chat/composer/composer-actions-popover';
import { ComposerModelSheet } from '@/super-chat/composer/composer-model-sheet';
import { ComposerSendButton } from '@/super-chat/composer/composer-send-button';
import { normalizeComposerDraft } from '@/super-chat/composer-state';
import type { ModelCatalogStatus } from '@/super-chat/llm/use-model-catalog';

export type SuperChatComposerProps = {
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: (message: string) => void;
  onNewChat: () => void;
  /** The live catalogue, already shaped for the sheet. */
  models: readonly HomeModel[];
  /** The selected model id, owned by the screen so both surfaces agree. */
  modelId: string;
  /** Thinking level per model id; the sheet reads and writes it. */
  thinkingByModel: Record<string, ThinkingLevel>;
  onModelSelect: (id: string) => void;
  onThinkingChange: (modelId: string, level: ThinkingLevel) => void;
  /** Catalogue state, so the sheet can show skeletons or a retry row. */
  status: ModelCatalogStatus;
  /** Why the catalogue fell back, when it did. */
  error: string | null;
  /** Refetches the catalogue after a failure. */
  reload: () => void;
  /** Retries on sheet open, skipping a try that just happened. */
  retryOnOpen: () => void;
  /** True while a reply is streaming; blocks a second send. */
  isStreaming: boolean;
  /** Stops the reply in flight. */
  onStop: () => void;
  translucent?: boolean;
};

export function SuperChatComposer({
  draft,
  onDraftChange,
  onSubmit,
  onNewChat,
  models,
  modelId,
  thinkingByModel,
  onModelSelect,
  onThinkingChange,
  status,
  error,
  reload,
  retryOnOpen,
  isStreaming,
  onStop,
  translucent = false,
}: SuperChatComposerProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const sans = useFontFamily('sans');
  const trimmed = draft.trim();
  const actions = useMemo(
    () => (isStreaming ? [STOP_ACTION, ...QUICK_ACTIONS] : QUICK_ACTIONS),
    [isStreaming],
  );

  function handleModelSelect(id: string) {
    onModelSelect(id);
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
      case 'action:stop':
        onStop();
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
          models={models}
          selectedId={modelId}
          thinkingByModel={thinkingByModel}
          status={status}
          error={error}
          reload={reload}
          retryOnOpen={retryOnOpen}
          onThinkingChange={onThinkingChange}
          onSelect={handleModelSelect}
        />
        <View style={styles.toolbarSpacer} />
        <ComposerActionsPopover items={actions} onSelect={handleActionSelect} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voice input"
          onPress={() => void Haptics.selectionAsync().catch(() => {})}
          style={({ pressed }) => [styles.iconTap, pressed && { opacity: 0.6 }]}>
          <AppIcon ios="mic" android="mic" size={22} color={theme.textDisplay} />
        </Pressable>
        <ComposerSendButton
          enabled={isStreaming || Boolean(trimmed)}
          mode={isStreaming ? 'stop' : 'send'}
          metalActive={!reducedMotion}
          onPress={isStreaming ? onStop : handleSend}
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
