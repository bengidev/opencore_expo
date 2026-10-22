import { router } from 'expo-router';
import { PanelUIProvider } from 'panelui-native/provider';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { HOME_SPEECH_LINES } from '@/home/home-content';
import { HomeComposer } from '@/home/home-composer';
import { HomeGreeting } from '@/home/home-greeting';
import { HOME_EDGE_INSET } from '@/home/home-layout';
import { SuggestionCarousel } from '@/home/suggestion-carousel';
import { HeroInteractionStage } from '@/onboarding/hero-interaction-stage';

const isStaticWebRender = Platform.OS === 'web' && typeof window === 'undefined';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');

  function handleSuggestionSelect(suggestion: { title: string }) {
    setDraft(suggestion.title);
  }

  function handleSubmit(message: string) {
    const trimmed = message.trim();
    if (!trimmed) return;
    setDraft('');
    router.push({ pathname: '/chat', params: { seed: trimmed } });
  }

  const content = (
    <ThemedView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}>
        <View
          style={[
            styles.column,
            {
              paddingTop: insets.top + Spacing.two,
              paddingBottom: Math.max(insets.bottom, Spacing.three),
            },
          ]}>
          <HomeGreeting />
          <HeroInteractionStage speechLines={HOME_SPEECH_LINES} stageStyle={styles.heroStage} />
          <View style={styles.bottom}>
            <SuggestionCarousel onSelect={handleSuggestionSelect} />
            <HomeComposer draft={draft} onChangeDraft={setDraft} onSubmit={handleSubmit} />
          </View>
        </View>
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
    gap: Spacing.two,
  },
  heroStage: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 200,
  },
  bottom: {
    gap: Spacing.one,
    paddingTop: 0,
    overflow: 'visible',
  },
});
