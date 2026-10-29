import { router } from 'expo-router';
import { PanelUIProvider } from 'panelui-native/provider';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { HOME_SPEECH_LINES, type HomeSuggestion } from '@/home/home-content';
import { HomeHistoryPill } from '@/home/home-history-pill';
import { HomePrompt } from '@/home/home-greeting';
import { HOME_COMPOSER_GAP, HOME_EDGE_INSET } from '@/home/home-layout';
import { SuggestionCarousel } from '@/home/suggestion-carousel';
import { useHomeEntrance } from '@/home/use-home-entrance';
import { SharkGlass, SharkOceanStage } from '@/onboarding/shark-ocean/shark-ocean-stage';
import { SuperChatComposer } from '@/super-chat/composer/super-chat-composer';

const isStaticWebRender = Platform.OS === 'web' && typeof window === 'undefined';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const entrance = useHomeEntrance();
  const [draft, setDraft] = useState('');

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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}>
        <SharkOceanStage speechLines={HOME_SPEECH_LINES} showSpeech={false}>
          <View
            style={[
              styles.column,
              {
                paddingTop: insets.top + Spacing.two,
                paddingBottom: Math.max(insets.bottom, Spacing.three),
              },
            ]}
            pointerEvents="box-none">
            <View style={styles.topBar} pointerEvents="box-none">
              <HomeHistoryPill />
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
          </View>
        </SharkOceanStage>
      </KeyboardAvoidingView>
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
  flex: {
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
