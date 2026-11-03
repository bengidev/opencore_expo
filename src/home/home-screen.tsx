import { router } from 'expo-router';
import { PanelUIProvider } from 'panelui-native/provider';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KeyboardDismissSurface, dismissKeyboard } from '@/components/keyboard-dismiss-surface';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { HOME_SPEECH_LINES, type HomeSuggestion } from '@/home/home-content';
import { HomeHistoryPanel } from '@/home/home-history-panel';
import { HomeHistoryPill } from '@/home/home-history-pill';
import { HomePrompt } from '@/home/home-greeting';
import { HOME_COMPOSER_GAP, HOME_EDGE_INSET } from '@/home/home-layout';
import { SuggestionCarousel } from '@/home/suggestion-carousel';
import { useHomeEntrance } from '@/home/use-home-entrance';
import { useKeyboardBottomPadding } from '@/hooks/use-keyboard-bottom-padding';
import { SharkGlass, SharkOceanStage } from '@/onboarding/shark-ocean/shark-ocean-stage';
import { SuperChatComposer } from '@/super-chat/composer/super-chat-composer';

const isStaticWebRender = Platform.OS === 'web' && typeof window === 'undefined';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const entrance = useHomeEntrance();
  const keyboardPadding = useKeyboardBottomPadding(
    Math.max(insets.bottom, Spacing.three),
    Spacing.three,
  );
  const [draft, setDraft] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);

  function handleSuggestionSelect(suggestion: HomeSuggestion) {
    setDraft(suggestion.title);
  }

  function handleSubmit(message: string) {
    const trimmed = message.trim();
    if (!trimmed) return;
    setDraft('');
    router.push({ pathname: '/super-chat', params: { seed: trimmed } });
  }

  const content = (
    <ThemedView type="background" style={styles.screen}>
      <KeyboardDismissSurface>
        <SharkOceanStage
          speechLines={HOME_SPEECH_LINES}
          showSpeech={false}
          onBackdropPress={dismissKeyboard}>
          <Animated.View
            style={[
              styles.column,
              { paddingTop: insets.top + Spacing.two },
              keyboardPadding,
            ]}
            pointerEvents="box-none">
            <View style={styles.topBar} pointerEvents="box-none">
              <HomeHistoryPill onOpen={() => setHistoryOpen(true)} />
            </View>
            <View style={styles.center} pointerEvents="box-none">
              <SharkGlass radius={Radius.sheet} style={styles.promptZone}>
                <Animated.View style={entrance.prompt}>
                  <HomePrompt />
                </Animated.View>
              </SharkGlass>
            </View>
            <View style={styles.bottom}>
              <Animated.View style={entrance.suggestions}>
                <SuggestionCarousel onSelect={handleSuggestionSelect} />
              </Animated.View>
              <Animated.View style={entrance.composer}>
                <SuperChatComposer
                  draft={draft}
                  onDraftChange={setDraft}
                  onSubmit={handleSubmit}
                  onNewChat={() => router.push('/super-chat')}
                />
              </Animated.View>
            </View>
          </Animated.View>
          {historyOpen ? <HomeHistoryPanel onClose={() => setHistoryOpen(false)} /> : null}
        </SharkOceanStage>
      </KeyboardDismissSurface>
    </ThemedView>
  );

  if (isStaticWebRender) {
    return content;
  }

  return <PanelUIProvider background={false}>{content}</PanelUIProvider>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  column: {
    flex: 1,
    paddingHorizontal: HOME_EDGE_INSET,
  },
  topBar: {
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptZone: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  bottom: {
    gap: HOME_COMPOSER_GAP,
    paddingTop: Spacing.three,
  },
});
