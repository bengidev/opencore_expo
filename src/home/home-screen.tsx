import { router } from 'expo-router';
import { PanelUIProvider } from 'panelui-native/provider';
import { useState } from 'react';
import { Dimensions, Platform, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated from 'react-native-reanimated';
import { initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context';

import { KeyboardDismissSurface, dismissKeyboard } from '@/components/keyboard-dismiss-surface';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { HOME_SPEECH_LINES, type HomeSuggestion } from '@/home/home-content';
import { HomePrompt } from '@/home/home-greeting';
import { HOME_COMPOSER_GAP, HOME_EDGE_INSET } from '@/home/home-layout';
import { SuggestionCarousel } from '@/home/suggestion-carousel';
import { useHomeEntrance } from '@/home/use-home-entrance';
import { useKeyboardBottomPadding } from '@/hooks/use-keyboard-bottom-padding';
import { SharkGlass, SharkOceanStage } from '@/onboarding/shark-ocean/shark-ocean-stage';
import { SuperChatComposer } from '@/super-chat/composer/super-chat-composer';

const isStaticWebRender = Platform.OS === 'web' && typeof window === 'undefined';

/**
 * The tab screen's bottom safe-area inset already includes the floating tab
 * bar, so the composer only needs a small gap above it. Android's tab router
 * pads the content itself, so there the gap is the base padding.
 */
const IOS_TAB_BAR_GAP = Spacing.two;

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const entrance = useHomeEntrance();
  const restingPadding =
    Platform.OS === 'ios'
      ? Math.max(insets.bottom, Spacing.three) + IOS_TAB_BAR_GAP
      : Spacing.three;
  const [reservedBottom, setReservedBottom] = useState(0);
  const keyboardPadding = useKeyboardBottomPadding(
    restingPadding,
    Spacing.three,
    reservedBottom,
  );
  const [draft, setDraft] = useState('');
  

  /**
   * The Android tab router lays the screen out between the status bar and the
   * native tab bar, so the content ends one tab bar above the window edge. The
   * keyboard height is measured from that edge; this offset keeps the composer
   * a constant gap above the keyboard instead of floating by the bar's height.
   *
   * `onLayout` reports the column's height inside the router's native wrapper;
   * the tab bar inset is owned by that wrapper and never reaches JS, so this
   * frame is the only place the real content edge is visible.
   */
  function measureReservedBottom(event: LayoutChangeEvent) {
    if (Platform.OS !== 'android') return;

    const topInset = initialWindowMetrics?.insets.top ?? 0;
    const screenHeight = Dimensions.get('screen').height;

    setReservedBottom(
      Math.max(0, Math.round(screenHeight - topInset - event.nativeEvent.layout.height)),
    );
  }

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
            pointerEvents="box-none"
            onLayout={measureReservedBottom}>
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
