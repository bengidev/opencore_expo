import { Host, Rectangle } from '@expo/ui/swift-ui';
import { foregroundStyle, glassEffect } from '@expo/ui/swift-ui/modifiers';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUiTier } from '@/lib/ui-tier';
import { resolveNativeFill, type NativeSurfaceProps } from '@/components/native-surface-shared';

/**
 * A container that each platform draws the way that platform draws containers.
 *
 * On iOS 26 a glass tone is the system's own Liquid Glass, applied the way
 * SwiftUI applies it: a shape, a material, and an optional tint. `UIGlassEffect`
 * (expo-glass-effect) skips rendering on some builds, while `glassEffect` always
 * draws the material and its rim, so this uses the SwiftUI one. Everything else
 * falls through to a filled container — a plain system surface, never an
 * outline, because the system would not draw one either.
 */
export function NativeSurface({
  tone = 'plain',
  radius = Radius.card,
  materialRadius,
  interactive = false,
  glassEffectStyle = 'regular',
  tintColor,
  transparent = false,
  style,
  children,
  ...rest
}: NativeSurfaceProps) {
  const theme = useTheme();
  const tier = useUiTier();
  const shape: ViewStyle = { borderRadius: radius, borderCurve: 'continuous' };

  if (tier === 'ios-glass' && tone === 'glass') {
    // No tint by default: a tint over this app's near-white canvas reads as a
    // solid panel, while untinted glass reads as a material with an edge.
    return (
      <View style={[shape, styles.clip, style]} {...rest}>
        <Host style={StyleSheet.absoluteFill} pointerEvents="none">
          <Rectangle
            modifiers={[
              foregroundStyle('#00000000'),
              glassEffect({
                glass: {
                  variant: glassEffectStyle === 'clear' ? 'clear' : 'regular',
                  interactive,
                  tint: tintColor,
                },
                shape: 'roundedRectangle',
                cornerRadius: radius,
              }),
            ]}
          />
        </Host>
        {children}
      </View>
    );
  }

  const fill = resolveNativeFill(tier, tone, transparent, theme);
  const materialShape =
    tier === 'android-material' && materialRadius !== undefined
      ? ({ borderRadius: materialRadius } satisfies ViewStyle)
      : null;

  return (
    <View style={[shape, fill, materialShape, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
});
