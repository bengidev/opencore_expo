import { View, type ViewStyle } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUiTier } from '@/lib/ui-tier';
import { resolveNativeFill, type NativeSurfaceProps } from '@/components/native-surface-shared';

/**
 * A container that each platform draws the way that platform draws containers.
 *
 * On iOS 26 a glass tone is real Liquid Glass — see `native-surface.ios.tsx`.
 * Everywhere else a surface is a filled container: a Material 3 tonal surface on
 * Android, where the tone carries the elevation and no outline is needed, and
 * the app's own one-pixel border on the custom tier, where nothing else would
 * separate the surface from the background.
 */
export function NativeSurface(props: NativeSurfaceProps) {
  // `interactive`, `glassEffectStyle` and `tintColor` only mean something to
  // Liquid Glass, so they are pulled out and dropped here rather than being
  // forwarded to a View that would not understand them.
  const { interactive, glassEffectStyle, tintColor, ...viewProps } = props;
  void interactive;
  void glassEffectStyle;
  void tintColor;

  const {
    tone = 'plain',
    radius = Radius.card,
    materialRadius,
    transparent = false,
    style,
    children,
    ...rest
  } = viewProps;

  const theme = useTheme();
  const tier = useUiTier();
  const shape: ViewStyle = { borderRadius: radius, borderCurve: 'continuous' };
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
