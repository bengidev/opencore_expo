import { router } from 'expo-router';
import { PanelUIProvider } from 'panelui-native/provider';
import { Platform, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { HeroInteractionStage } from '@/onboarding/hero-interaction-stage';
import { OnboardingHeadline } from '@/onboarding/headline';
import { ONBOARDING_SPEECH_LINES } from '@/onboarding/speech-bubble';
import { OnboardingStartButton } from '@/onboarding/start-button';
import { OnboardingSubtitle } from '@/onboarding/subtitle';
import { useOnboardingEntrance } from '@/onboarding/use-entrance';

const isStaticWebRender = Platform.OS === 'web' && typeof window === 'undefined';

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const entrance = useOnboardingEntrance();

  const content = (
      <ThemedView style={styles.screen}>
        <View
          style={[
            styles.column,
            {
              paddingTop: insets.top + Spacing.five,
              paddingBottom: Math.max(insets.bottom, Spacing.four),
            },
          ]}>
        <Animated.View style={entrance.headline}>
          <OnboardingHeadline />
        </Animated.View>
        <HeroInteractionStage
          speechLines={ONBOARDING_SPEECH_LINES}
          heroWrapperStyle={entrance.hero}
          speechWrapperStyle={entrance.speech}
        />
        <Animated.View style={entrance.subtitle}>
          <OnboardingSubtitle />
        </Animated.View>
        <Animated.View style={entrance.button}>
          <OnboardingStartButton
            enableShimmer={!isStaticWebRender}
            onPress={() => router.replace('/super-chat')}
          />
        </Animated.View>
        </View>
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
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
});
