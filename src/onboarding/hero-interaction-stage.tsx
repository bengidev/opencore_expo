import { useEffect, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, type AnimatedStyle } from 'react-native-reanimated';

import { Spacing } from '@/constants/theme';
import { OnboardingHero } from '@/onboarding/hero-slot';
import type { OnboardingHeroMotion } from '@/onboarding/hero-bot';
import {
  BUBBLE_LAYOUT,
  OnboardingSpeech,
  type OnboardingSpeechSize,
} from '@/onboarding/speech-bubble';
import { speechBubbleMotion, speechBubblePlacement } from '@/onboarding/speech-bubble-layout';
import { advanceSpeech, type OnboardingSpeechState } from '@/onboarding/speech-rotation';

const DEFAULT_ROTATION_DELAY_MS = 5000;

type SpeechLines = readonly [string, string, ...string[]];

type HeroInteractionStageProps = {
  speechLines: SpeechLines;
  rotationDelayMs?: number;
  heroWrapperStyle?: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;
  speechWrapperStyle?: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;
  stageStyle?: StyleProp<ViewStyle>;
};

export function HeroInteractionStage({
  speechLines,
  rotationDelayMs = DEFAULT_ROTATION_DELAY_MS,
  heroWrapperStyle,
  speechWrapperStyle,
  stageStyle,
}: HeroInteractionStageProps) {
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
  const message = speechLines[speech.index] ?? speechLines[0] ?? '';

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSpeech((current) => advanceSpeech({ state: current, reason: 'timer', lines: speechLines }));
    }, rotationDelayMs);

    return () => clearTimeout(timeout);
  }, [rotationDelayMs, speech.revision, speechLines]);

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
    setSpeech((current) => advanceSpeech({ state: current, reason: 'tap', lines: speechLines }));
  };

  return (
    <View
      style={[styles.stage, stageStyle]}
      onLayout={({ nativeEvent: { layout } }) => {
        setStageWidth((current) => (current === layout.width ? current : layout.width));
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
            speechWrapperStyle,
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
        <Animated.View style={[styles.hero, heroWrapperStyle]}>
          <OnboardingHero
            onTap={handleHeroTap}
            motion={heroMotion}
            autoMotionRevision={speech.autoMotionRevision}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
