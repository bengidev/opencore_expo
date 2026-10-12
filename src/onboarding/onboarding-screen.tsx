import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { OnboardingHeadline } from '@/onboarding/headline';
import { OnboardingHero } from '@/onboarding/hero-slot';
import { OnboardingSpeech } from '@/onboarding/speech-bubble';
import { OnboardingStartButton } from '@/onboarding/start-button';
import { OnboardingSubtitle } from '@/onboarding/subtitle';

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();

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
        <OnboardingHeadline />
        <View style={styles.stage}>
          <View style={styles.speech}>
            <OnboardingSpeech />
          </View>
          <OnboardingHero />
        </View>
        <OnboardingSubtitle />
        <OnboardingStartButton onPress={() => router.replace('/chat')} />
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
