import { router } from 'expo-router';
import { PanelUIProvider } from 'panelui-native/provider';
import { Platform, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { OnboardingHeadline } from '@/onboarding/headline';
import { SharkGlass, SharkOceanStage } from '@/onboarding/shark-ocean/shark-ocean-stage';
import { ONBOARDING_SPEECH_LINES } from '@/onboarding/speech-lines';
import { OnboardingStartButton } from '@/onboarding/start-button';
import { OnboardingSubtitle } from '@/onboarding/subtitle';
import { useOnboardingEntrance } from '@/onboarding/use-entrance';

const isStaticWebRender = Platform.OS === 'web' && typeof window === 'undefined';

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const entrance = useOnboardingEntrance();

  const content = (
    <ThemedView style={styles.screen}>
      <SharkOceanStage speechLines={ONBOARDING_SPEECH_LINES}>
        <View
          style={[
            styles.column,
            {
              paddingTop: insets.top + Spacing.five,
              paddingBottom: Math.max(insets.bottom, Spacing.four),
            },
          ]}
          pointerEvents="box-none">
          <SharkGlass radius={24} style={styles.headlineGlass}>
            <Animated.View style={entrance.headline}>
              <OnboardingHeadline />
            </Animated.View>
          </SharkGlass>
          <View style={styles.heroSpacer} pointerEvents="none" />
          <SharkGlass radius={24} style={styles.copyGlass}>
            <Animated.View style={entrance.subtitle}>
              <OnboardingSubtitle />
            </Animated.View>
            <Animated.View style={entrance.button}>
              <OnboardingStartButton
                enableShimmer={!isStaticWebRender}
                onPress={() => router.replace('/home')}
              />
            </Animated.View>
          </SharkGlass>
        </View>
      </SharkOceanStage>
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
  headlineGlass: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  heroSpacer: {
    flex: 1,
    minHeight: 120,
  },
  copyGlass: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
});
