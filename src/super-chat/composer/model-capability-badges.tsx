import * as Haptics from 'expo-haptics';
import type { ComponentRef } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cubicBezier,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  MODEL_CAPABILITIES,
  type HomeModel,
  type ModelCapabilityId,
} from '@/super-chat/composer/chat-models';
import {
  CAPABILITY_BADGE_GAP,
  CAPABILITY_BADGE_SIZE,
} from '@/super-chat/composer/model-sheet-metrics';

export type CapabilityTooltipAnchor = {
  modelId: string;
  modelName: string;
  capability: ModelCapabilityId;
  /** Badge bounds in window coordinates. */
  left: number;
  top: number;
  width: number;
  height: number;
};

export type CapabilityTooltipContainer = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ModelCapabilityBadgesProps = {
  model: HomeModel;
  /** The capability whose tooltip is open, if any. */
  activeCapabilityId: ModelCapabilityId | null;
  onShowTooltip: (anchor: CapabilityTooltipAnchor) => void;
};

/**
 * The model's capabilities as bordered icon badges beside its name. A long
 * press holds the badge open, pops it slightly and shows the explanation.
 */
export function ModelCapabilityBadges({
  model,
  activeCapabilityId,
  onShowTooltip,
}: ModelCapabilityBadgesProps) {
  return (
    <View style={styles.badgeRow}>
      {model.capabilities.map((capabilityId) => (
        <CapabilityBadge
          key={capabilityId}
          modelId={model.id}
          modelName={model.name}
          capabilityId={capabilityId}
          isActive={activeCapabilityId === capabilityId}
          onShowTooltip={onShowTooltip}
        />
      ))}
    </View>
  );
}

type CapabilityBadgeProps = {
  modelId: string;
  modelName: string;
  capabilityId: ModelCapabilityId;
  isActive: boolean;
  onShowTooltip: (anchor: CapabilityTooltipAnchor) => void;
};

function CapabilityBadge({
  modelId,
  modelName,
  capabilityId,
  isActive,
  onShowTooltip,
}: CapabilityBadgeProps) {
  const theme = useTheme();
  const ref = useRef<ComponentRef<typeof Pressable>>(null);
  const reducedMotion = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const capability = MODEL_CAPABILITIES[capabilityId];

  const show = () => {
    ref.current?.measureInWindow((left, top, width, height) => {
      onShowTooltip({
        modelId,
        modelName,
        capability: capabilityId,
        left,
        top,
        width,
        height,
      });
    });
  };

  const handleLongPress = () => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    show();
  };

  return (
    <Animated.View
      style={
        reducedMotion
          ? {
              transitionProperty: 'opacity',
              transitionDuration: 120,
              transitionTimingFunction: easeOut,
              opacity: pressed ? 0.7 : 1,
            }
          : {
              transitionProperty: 'transform',
              transitionDuration: pressed ? 120 : 200,
              transitionTimingFunction: easeOut,
              transform: [{ scale: pressed ? 0.88 : isActive ? 1.08 : 1 }],
            }
      }>
      <Pressable
        ref={ref}
        accessibilityRole="button"
        accessibilityLabel={capability.label}
        accessibilityHint={capability.description}
        testID={`model-capability-${modelId}-${capabilityId}`}
        delayLongPress={320}
        hitSlop={4}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        onLongPress={handleLongPress}
        onPress={Platform.OS === 'web' ? show : undefined}
        style={({ pressed }) => [
          styles.badge,
          { borderColor: isActive ? theme.textSecondary : theme.borderVisible },
          pressed && { backgroundColor: theme.surfaceRaised },
        ]}>
        <AppIcon
          ios={capability.iosSymbol}
          android={capability.fallbackIcon}
          size={13}
          color={isActive ? theme.textDisplay : theme.textSecondary}
        />
      </Pressable>
    </Animated.View>
  );
}

const TOOLTIP_WIDTH = 248;
const TOOLTIP_GAP = 8;
const TOOLTIP_MARGIN = 12;
const TOOLTIP_ARROW = 10;
const easeOut = cubicBezier(0.23, 1, 0.32, 1);
const timingEase = Easing.bezier(0.23, 1, 0.32, 1);

type CapabilityTooltipProps = {
  anchor: CapabilityTooltipAnchor | null;
  container: CapabilityTooltipContainer | null;
  onDismiss: () => void;
};

/**
 * The long-press explanation. It lives in the sheet's overlay layer so the
 * card can escape the row's bounds, and it grows away from the badge: the
 * card is pinned by its bottom edge when it opens above the badge, so its
 * height never needs to be known up front.
 */
export function CapabilityTooltip({ anchor, container, onDismiss }: CapabilityTooltipProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const [cardHeight, setCardHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!anchor) {
      progress.value = 0;
      return;
    }
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: reducedMotion ? 0 : 160,
      easing: timingEase,
    });
    const timeout = setTimeout(onDismiss, 4200);
    return () => clearTimeout(timeout);
  }, [anchor, onDismiss, progress, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: reducedMotion ? 1 : 0.96 + progress.value * 0.04 }],
  }));

  if (!anchor || !container) return null;

  const capability = MODEL_CAPABILITIES[anchor.capability];
  const width = Math.min(TOOLTIP_WIDTH, container.width - TOOLTIP_MARGIN * 2);
  const anchorLeft = anchor.left - container.x;
  const anchorTop = anchor.top - container.y;
  const anchorCenter = anchorLeft + anchor.width / 2;
  // The card needs its measured height to pick the side with room, so it is
  // placed with its top edge and clamped inside the sheet. A first-render
  // estimate avoids a visible flip once the real height lands.
  const height = cardHeight ?? 100;
  const availableAbove = anchorTop - TOOLTIP_MARGIN;
  const availableBelow =
    container.height - (anchorTop + anchor.height) - TOOLTIP_MARGIN;
  const opensAbove =
    availableBelow < height + TOOLTIP_GAP && availableAbove > availableBelow;
  const preferredTop = opensAbove
    ? anchorTop - height - TOOLTIP_GAP
    : anchorTop + anchor.height + TOOLTIP_GAP;
  const top = Math.min(
    Math.max(preferredTop, TOOLTIP_MARGIN),
    Math.max(container.height - height - TOOLTIP_MARGIN, TOOLTIP_MARGIN),
  );
  const left = Math.min(
    Math.max(anchorCenter - width / 2, TOOLTIP_MARGIN),
    container.width - width - TOOLTIP_MARGIN,
  );
  const arrowLeft = Math.min(Math.max(anchorCenter - left, 18), width - 18);

  return (
    <View style={styles.tooltipLayer}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} accessible={false} />
      <Animated.View
        style={[
          styles.tooltip,
          {
            left,
            width,
            top,
            transformOrigin: `${arrowLeft}px ${opensAbove ? '100%' : '0%'}`,
          },
          animatedStyle,
        ]}
        onLayout={(event) => {
          const next = event.nativeEvent.layout.height;
          if (next > 0 && Math.abs(next - (cardHeight ?? 0)) > 1) {
            setCardHeight(next);
          }
        }}>
        <View
          style={[
            styles.tooltipArrow,
            opensAbove ? { bottom: -TOOLTIP_ARROW / 2 } : { top: -TOOLTIP_ARROW / 2 },
            {
              left: arrowLeft - TOOLTIP_ARROW / 2,
              backgroundColor: theme.surfaceRaised,
              borderColor: theme.borderVisible,
            },
          ]}
        />
        <View
          style={[
            styles.tooltipCard,
            { backgroundColor: theme.surfaceRaised, borderColor: theme.borderVisible },
          ]}>
          <View style={styles.tooltipHeader}>
            <AppIcon
              ios={capability.iosSymbol}
              android={capability.fallbackIcon}
              size={13}
              color={theme.textSecondary}
            />
            <ThemedText variant="label" themeColor="textSecondary">
              {capability.label}
            </ThemedText>
          </View>
          <ThemedText variant="bodySm" themeColor="text">
            {capability.description}
          </ThemedText>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: CAPABILITY_BADGE_GAP,
  },
  badge: {
    width: CAPABILITY_BADGE_SIZE,
    height: CAPABILITY_BADGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: CAPABILITY_BADGE_SIZE / 2,
  },
  tooltipLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tooltip: {
    position: 'absolute',
  },
  tooltipArrow: {
    position: 'absolute',
    width: TOOLTIP_ARROW,
    height: TOOLTIP_ARROW,
    borderWidth: 1,
    transform: [{ rotate: '45deg' }],
  },
  tooltipCard: {
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: Spacing.three / 1.5,
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
});
