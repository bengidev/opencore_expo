import { router } from 'expo-router';
import { PanelUIProvider } from 'panelui-native/provider';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { HomeComposer } from '@/home/home-composer';
import { HomeHistoryPill } from '@/home/home-history-pill';
import { HomePrompt } from '@/home/home-greeting';
import { useHomeEntrance } from '@/home/use-home-entrance';
import { HOME_SPEECH_LINES } from '@/home/home-content';
import { SharkGlass, SharkOceanStage } from '@/onboarding/shark-ocean/shark-ocean-stage';

const isStaticWebRender = Platform.OS === 'web' && typeof window === 'undefined';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const entrance = useHomeEntrance();
  const [draft, setDraft] = useState('');

  function handleSubmit(message: string) {
    const trimmed = message.trim();
    if (!trimmed) return;
    setDraft('');
    router.push({ pathname: '/super-chat', params: { seed: trimmed } });
  }

  const content = (
    <ThemedView type="backgroundHero" style={styles.screen}>
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
              <SharkGlass glass={false} radius={24} style={styles.promptZone}>
                <Animated.View style={entrance.prompt}>
                  <HomePrompt />
                </Animated.View>
              </SharkGlass>
              <Animated.View style={[styles.composer, entrance.composer]}>
                <HomeComposer
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
    paddingHorizontal: Spacing.four,
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
    gap: Spacing.three,
    paddingBottom: 108,
  },
  promptZone: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  composer: {
    width: '100%',
    alignItems: 'center',
  },
});
