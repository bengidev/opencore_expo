import { Canvas, Picture, useFont, type SkPicture } from '@shopify/react-native-skia';
import { useFocusEffect } from 'expo-router';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { AppState, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { placeBubble } from './bubble-placement';
import { GlassZoneContext, type RegisterGlassZone } from './glass-zone';
import { oceanGrid } from './grid';
import { createSharkRoster } from './hero-roster';
import { OceanSpeechBubble } from './ocean-speech-bubble';
import { SkiaOceanRenderer } from './skia-renderer';
import type { GlassZone } from './types';
import { World } from './world';
import type { SharkOceanStageProps } from './stage-types';

const SPEECH_HOLD_MS = 5200;
const SPEECH_FONT = require('@expo-google-fonts/space-mono/700Bold/SpaceMono_700Bold.ttf');
const SIM_STEP = 1 / 60;
// A single frame may replay at most this much simulation, so one long stall
// costs a bounded burst of steps instead of a freeze.
const MAX_CATCHUP_STEPS = 8;

export function SharkOceanStageLive({
  speechLines,
  showSpeech = true,
  children,
}: SharkOceanStageProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const reducedMotion = useReducedMotion() ?? false;
  const [heroes] = useState(() => createSharkRoster());
  const [size, setSize] = useState({ width: 0, height: 0 });
  const { fontSize } = oceanGrid(size.width || 390);
  const font = useFont(SPEECH_FONT, fontSize);
  const [picture, setPicture] = useState<SkPicture | null>(null);
  const [focused, setFocused] = useState(true);
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const [zones, setZones] = useState<GlassZone[]>([]);
  const [speech, setSpeech] = useState({ index: 0, revision: 0, speakerIndex: 0 });
  const [bubblePlacement, setBubblePlacement] = useState<'above' | 'below'>('above');
  const [bubbleVisible, setBubbleVisible] = useState(false);

  const [world] = useState(
    () => new World(heroes.map(({ kind, size: sharkSize }) => ({ kind, size: sharkSize }))),
  );
  const [renderer] = useState(() => new SkiaOceanRenderer(scheme));
  const zonesRef = useRef<Map<string, GlassZone>>(new Map());
  const zoneListRef = useRef<GlassZone[]>([]);
  const bubbleSizeRef = useRef({ width: 0, height: 0 });
  const bubblePosRef = useRef<{ left: number; top: number } | null>(null);
  const bubblePlacementRef = useRef<'above' | 'below'>('above');
  const bubbleVisibleRef = useRef(false);
  const speechRef = useRef(speech);

  const bubbleX = useSharedValue(0);
  const bubbleY = useSharedValue(0);
  const bubbleOpacity = useSharedValue(0);
  const bubbleTailX = useSharedValue(14);

  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: bubbleOpacity.get(),
    transform: [{ translateX: bubbleX.get() }, { translateY: bubbleY.get() }],
  }));

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      setAppActive(state === 'active');
    });
    return () => subscription.remove();
  }, []);

  useLayoutEffect(() => {
    speechRef.current = speech;
  }, [speech]);

  const registerZone = useCallback<RegisterGlassZone>((id, zone) => {
    const map = zonesRef.current;
    if (zone) map.set(id, zone);
    else map.delete(id);
    zoneListRef.current = Array.from(map.values());
    setZones(zoneListRef.current);
  }, []);

  useLayoutEffect(() => {
    renderer.setTheme(scheme);
  }, [renderer, scheme]);

  useLayoutEffect(() => {
    if (!size.width || !size.height || !font) return;
    renderer.resize(size.width, size.height);
    world.resize(size.width, size.height, renderer.cellWidth, renderer.cellHeight);
  }, [font, renderer, size.height, size.width, world]);

  useLayoutEffect(() => {
    if (size.height < 1) return;
    let topZone: GlassZone | null = null;
    let bottomZone: GlassZone | null = null;
    for (const zone of zones) {
      if (!topZone || zone.y < topZone.y) topZone = zone;
      if (!bottomZone || zone.y + zone.height > bottomZone.y + bottomZone.height) {
        bottomZone = zone;
      }
    }
    world.setHeaderInset(topZone ? topZone.y + topZone.height : 0);
    world.setFooterInset(bottomZone ? size.height - bottomZone.y : 0);
  }, [size.height, world, zones]);

  const lines = speechLines.length > 0 ? speechLines : [''];
  const message = lines[speech.index % lines.length] ?? '';

  const advanceSpeech = useCallback(() => {
    setSpeech((current) => ({
      index: (current.index + 1) % lines.length,
      revision: current.revision + 1,
      speakerIndex: (current.speakerIndex + 1) % heroes.length,
    }));
  }, [heroes.length, lines.length]);

  useEffect(() => {
    const timer = setTimeout(advanceSpeech, SPEECH_HOLD_MS);
    return () => clearTimeout(timer);
  }, [advanceSpeech, speech.revision]);

  const updateBubble = useCallback(
    (world: World) => {
      if (!showSpeech) return;
      const current = speechRef.current;
      const hero = heroes[current.speakerIndex];
      const shark = hero ? world.sharks.find((candidate) => candidate.id === hero.id) : null;
      const bubble = bubbleSizeRef.current;
      if (!shark || bubble.width < 1 || bubble.height < 1) {
        if (bubbleVisibleRef.current) {
          bubbleVisibleRef.current = false;
          setBubbleVisible(false);
        }
        bubbleOpacity.set(0);
        return;
      }

      const headX = shark.nodes[0] + Math.cos(shark.heading) * shark.length * 0.08;
      const headY = shark.nodes[1] + Math.sin(shark.heading) * shark.length * 0.08;
      const placement = placeBubble({
        headX,
        headY,
        stageWidth: size.width,
        stageHeight: size.height,
        bubbleWidth: bubble.width,
        bubbleHeight: bubble.height,
        safeTop: insets.top + 8,
        safeBottom: size.height - insets.bottom - 8,
        avoid: zoneListRef.current.map((zone) => ({
          left: zone.x,
          top: zone.y,
          right: zone.x + zone.width,
          bottom: zone.y + zone.height,
        })),
        avoidPad: 24,
      });

      const target = { left: placement.left, top: placement.top };
      const previous = bubblePosRef.current;
      const position = previous
        ? {
            left: previous.left + (target.left - previous.left) * 0.35,
            top: previous.top + (target.top - previous.top) * 0.35,
          }
        : target;
      bubblePosRef.current = position;
      bubbleX.set(position.left);
      bubbleY.set(position.top);
      bubbleTailX.set(placement.tailX);
      bubbleOpacity.set(placement.visible ? 1 : 0);

      if (placement.placement !== bubblePlacementRef.current) {
        bubblePlacementRef.current = placement.placement;
        setBubblePlacement(placement.placement);
      }
      if (placement.visible !== bubbleVisibleRef.current) {
        bubbleVisibleRef.current = placement.visible;
        setBubbleVisible(placement.visible);
      }
    },
    [
      bubbleOpacity,
      bubbleTailX,
      bubbleX,
      bubbleY,
      heroes,
      insets.bottom,
      insets.top,
      showSpeech,
      size.height,
      size.width,
    ],
  );

  useEffect(() => {
    if (!font || size.width < 1 || size.height < 1) return;
    if (!focused || !appActive) return;

    if (reducedMotion) {
      if (world.time < 4) {
        for (let index = 0; index < 240; index++) world.step(1 / 60);
      }
      const next = renderer.render(world, 1 / 60, font, zoneListRef.current);
      setPicture(next);
      updateBubble(world);
      return;
    }

    let frameId = 0;
    let last = performance.now();
    let accumulator = 0;

    const frame = (now: number) => {
      const elapsed = (now - last) / 1000;
      last = now;
      // Keep the leftover so the world advances by wall time, not by frame count.
      // Only a real stall, one past the catch-up budget, drops time.
      accumulator = Math.min(accumulator + Math.max(0, elapsed), SIM_STEP * MAX_CATCHUP_STEPS);
      while (accumulator >= SIM_STEP) {
        world.step(SIM_STEP);
        accumulator -= SIM_STEP;
      }

      setPicture(renderer.render(world, SIM_STEP, font, zoneListRef.current));
      updateBubble(world);
      frameId = requestAnimationFrame(frame);
    };

    frameId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(frameId);
  }, [
    appActive,
    focused,
    font,
    reducedMotion,
    renderer,
    size.height,
    size.width,
    updateBubble,
    world,
  ]);

  const handleBubbleLayout = useCallback((next: { width: number; height: number }) => {
    bubbleSizeRef.current = next;
  }, []);

  const handleSplash = useCallback(
    (x: number, y: number) => {
      world.splash(x, y);
    },
    [world],
  );

  return (
    <GlassZoneContext.Provider value={registerZone}>
      <View
        style={[styles.root, { backgroundColor: theme.background }]}
        onLayout={({ nativeEvent: { layout } }) => {
          setSize((current) =>
            current.width === layout.width && current.height === layout.height
              ? current
              : { width: layout.width, height: layout.height },
          );
        }}>
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          {picture ? <Picture picture={picture} /> : null}
        </Canvas>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={(event) =>
            handleSplash(event.nativeEvent.locationX, event.nativeEvent.locationY)
          }
          accessibilityLabel="Ocean"
        />
        <View style={styles.content} pointerEvents="box-none">
          {children}
        </View>
        {showSpeech ? (
          <Animated.View
            pointerEvents={bubbleVisible ? 'box-none' : 'none'}
            style={[styles.bubbleLayer, bubbleStyle]}>
            <OceanSpeechBubble
              message={message}
              revision={speech.revision}
              maxWidth={Math.min(260, Math.max(180, size.width - 32))}
              placement={bubblePlacement}
              tailLeft={bubbleTailX}
              onLayout={handleBubbleLayout}
              onPress={advanceSpeech}
            />
          </Animated.View>
        ) : null}
      </View>
    </GlassZoneContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  bubbleLayer: {
    position: 'absolute',
    zIndex: 2,
    top: 0,
    left: 0,
  },
});

export default SharkOceanStageLive;
