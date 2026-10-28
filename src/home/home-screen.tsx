import { router } from 'expo-router';
import { PanelUIProvider } from 'panelui-native/provider';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { HOME_SPEECH_LINES } from '@/home/home-content';
import { SuperChatComposer } from '@/super-chat/composer/super-chat-composer.tsx';
import { HomeGreeting } from '@/home/home-greeting';
import { SharkGlass, SharkOceanStage } from '@/onboarding/shark-ocean/shark-ocean-stage';
import { HOME_COMPOSER_GAP, HOME_EDGE_INSET } from '@/home/home-layout';
import { SuggestionCarousel } from '@/home/suggestion-carousel';

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
    router.push({ pathname: '/super-chat', params: { seed: trimmed } });
  }

  const content = (
    <ThemedView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}>
        <SharkOceanStage speechLines={HOME_SPEECH_LINES}>
          <View
            style={[
              styles.column,
              {
                paddingTop: insets.top + Spacing.two,
                paddingBottom: Math.max(insets.bottom, Spacing.three),
              },
            ]}
            pointerEvents="box-none">
            <SharkGlass radius={24} style={styles.greetingGlass}>
              <HomeGreeting />
            </SharkGlass>
            <View style={styles.heroSpacer} pointerEvents="none" />
            <View style={styles.bottom} pointerEvents="box-none">
              <SharkGlass radius={24}>
                <SuggestionCarousel onSelect={handleSuggestionSelect} />
              </SharkGlass>
              <SharkGlass radius={Radius.surface}>
                <SuperChatComposer
                  draft={draft}
                  onDraftChange={setDraft}
                  onSubmit={handleSubmit}
                  onNewChat={() => router.push('/super-chat')}
                  translucent
                />
              </SharkGlass>
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
    gap: Spacing.two,
  },
  greetingGlass: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  heroSpacer: {
    flex: 1,
    minHeight: 120,
  },
  bottom: {
    gap: HOME_COMPOSER_GAP,
    paddingTop: 0,
    overflow: 'visible',
  },
});
