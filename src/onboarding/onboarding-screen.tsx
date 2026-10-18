import { router } from 'expo-router';
import { PanelUIProvider } from 'panelui-native/provider';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { OnboardingHeadline } from '@/onboarding/headline';
import { OnboardingHero } from '@/onboarding/hero-slot';
import type { OnboardingHeroMotion } from '@/onboarding/hero-bot';
import {
  BUBBLE_LAYOUT,
  ONBOARDING_SPEECH_LINES,
  OnboardingSpeech,
  type OnboardingSpeechSize,
} from '@/onboarding/speech-bubble';
import { speechBubbleMotion, speechBubblePlacement } from '@/onboarding/speech-bubble-layout';
import { OnboardingStartButton } from '@/onboarding/start-button';
import { OnboardingSubtitle } from '@/onboarding/subtitle';
import { useOnboardingEntrance } from '@/onboarding/use-entrance';
import { advanceSpeech, type OnboardingSpeechState } from '@/onboarding/speech-rotation';

const SPEECH_ROTATION_DELAY_MS = 5000;

const isStaticWebRender = Platform.OS === 'web' && typeof window === 'undefined';

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const entrance = useOnboardingEntrance();
  const heroMotion = useSharedValue<OnboardingHeroMotion>({ x: 0, y: 0, sx: 1, sy: 1, pitch: 0, roll: 0 });
  const [stageWidth, setStageWidth] = useState(0);
  const [heroBounds, setHeroBounds] = useState({ x: 0, width: 0 });
  const [bubbleSize, setBubbleSize] = useState<OnboardingSpeechSize>({ width: 0, height: 0 });
  const [speech, setSpeech] = useState<OnboardingSpeechState>({
    index: 0,
    revision: 0,
    anchorFraction: 0.5,
    autoMotionRevision: 0,
  });
  const message = ONBOARDING_SPEECH_LINES[speech.index] ?? ONBOARDING_SPEECH_LINES[0];

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSpeech((current) =>
        advanceSpeech({ state: current, reason: 'timer', lines: ONBOARDING_SPEECH_LINES }),
      );
    }, SPEECH_ROTATION_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [speech.revision]);
  const placement = speechBubblePlacement({
    stageWidth,
    heroX: heroBounds.x,
    heroWidth: heroBounds.width,
    bubbleWidth: bubbleSize.width || 120,
    anchorFraction: speech.anchorFraction,
  });
  const maxBubbleWidth = stageWidth > 0 ? Math.min(240, stageWidth - 16) : 240;
  const speechPoseStyle = useAnimatedStyle(() => {
    const offset = speechBubbleMotion({
      heroSize: heroBounds.width,
      anchorFraction: speech.anchorFraction,
      pose: heroMotion.get(),
    });
    return { transform: [{ translateX: offset.x }, { translateY: offset.y }] };
  });

  const handleHeroTap = () => {
    setSpeech((current) => advanceSpeech({ state: current, reason: 'tap', lines: ONBOARDING_SPEECH_LINES }));
  };

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
        <View
          style={styles.stage}
          onLayout={({ nativeEvent: { layout } }) => {
            setStageWidth((current) => current === layout.width ? current : layout.width);
          }}>
          <View
            style={styles.heroAnchor}
            onLayout={({ nativeEvent: { layout } }) => {
              setHeroBounds((current) =>
                current.x === layout.x && current.width === layout.width
                  ? current
                  : { x: layout.x, width: layout.width },
              );
            }}>
            <Animated.View
              layout={BUBBLE_LAYOUT}
              style={[
                styles.speech,
                {
                  left: placement.left,
                  transformOrigin: [placement.tailLeft + 9, '100%', 0],
                },
                entrance.speech,
              ]}>
              <Animated.View style={speechPoseStyle}>
                <OnboardingSpeech
                  message={message}
                  revision={speech.revision}
                  maxWidth={maxBubbleWidth}
                  tailLeft={placement.tailLeft}
                  onLayout={(size) => {
                    setBubbleSize((current) =>
                      current.width === size.width && current.height === size.height ? current : size,
                    );
                  }}
                />
              </Animated.View>
            </Animated.View>
            <Animated.View style={[styles.hero, entrance.hero]}>
              <OnboardingHero
                onTap={handleHeroTap}
                motion={heroMotion}
                autoMotionRevision={speech.autoMotionRevision}
              />
            </Animated.View>
          </View>
        </View>
        <Animated.View style={entrance.subtitle}>
          <OnboardingSubtitle />
        </Animated.View>
        <Animated.View style={entrance.button}>
          <OnboardingStartButton
            enableShimmer={!isStaticWebRender}
            onPress={() => router.replace('/chat')}
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
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  heroAnchor: {
    alignItems: 'center',
    overflow: 'visible',
  },
  hero: {
    overflow: 'visible',
  },
  speech: {
    position: 'absolute',
    bottom: '100%',
    zIndex: 1,
    marginBottom: Spacing.three,
  },
});
