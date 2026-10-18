import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
  type GlassColorScheme,
} from 'expo-glass-effect';
import type { ReactNode } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

export function useIosLiquidGlass(): boolean {
  return Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
}

type LiquidGlassViewProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  fallbackStyle?: StyleProp<ViewStyle>;
  isInteractive?: boolean;
  glassEffectStyle?: 'clear' | 'regular';
};

export function LiquidGlassView({
  children,
  style,
  fallbackStyle,
  isInteractive = false,
  glassEffectStyle = 'regular',
}: LiquidGlassViewProps) {
  const scheme = useColorScheme();
  const glassColorScheme: GlassColorScheme = scheme === 'dark' ? 'dark' : 'light';
  const iosGlass = useIosLiquidGlass();

  if (iosGlass) {
    return (
      <GlassView
        isInteractive={isInteractive}
        glassEffectStyle={glassEffectStyle}
        colorScheme={glassColorScheme}
        style={style}>
        {children}
      </GlassView>
    );
  }

  return <View style={[style, fallbackStyle]}>{children}</View>;
}
