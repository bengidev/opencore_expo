import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { OnboardingHeadline } from '@/onboarding/headline';
import { OnboardingHero } from '@/onboarding/hero-slot';
import { OnboardingSpeech } from '@/onboarding/speech-bubble';
import { OnboardingStartButton } from '@/onboarding/start-button';
import { OnboardingSubtitle } from '@/onboarding/subtitle';
import { useOnboardingEntrance } from '@/onboarding/use-entrance';

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const entrance = useOnboardingEntrance();

  return (
    <ThemedView style={styles.screen}>
      <View
        style={[
          styles.column,
          {
            paddingTop: insets.top + Spacing.five,
            paddingBottom: Math.max(insets.bottom, Spacing.four),
          },
        ]}>
        <Animated.View style={entrance.headline.style} pointerEvents={entrance.headline.pointerEvents}>
          <OnboardingHeadline />
        </Animated.View>
        <View style={styles.stage}>
          <Animated.View
            style={[styles.speech, entrance.speech.style]}
            pointerEvents={entrance.speech.pointerEvents}>
            <OnboardingSpeech />
          </Animated.View>
          <Animated.View style={entrance.hero.style} pointerEvents={entrance.hero.pointerEvents}>
            <OnboardingHero />
          </Animated.View>
        </View>
        <Animated.View style={entrance.subtitle.style} pointerEvents={entrance.subtitle.pointerEvents}>
          <OnboardingSubtitle />
        </Animated.View>
        <Animated.View style={entrance.button.style} pointerEvents={entrance.button.pointerEvents}>
          <OnboardingStartButton onPress={() => router.replace('/chat')} />
        </Animated.View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  column: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.five,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  speech: {
    position: 'absolute',
    top: '18%',
    left: Spacing.four,
  },
});
