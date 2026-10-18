import { MetalFx, isMetalFxSupported } from 'metal-fx';
import type { CSSProperties } from 'react';
import { View } from 'react-native';

import type { AppMetalFxProps } from '@/components/app-metal-fx.types';
import { useAppMetalFx } from '@/hooks/use-app-metal-fx';

export function AppMetalFx({
  children,
  variant = 'circle',
  preset,
  strength,
  innerShadow,
  paused = false,
  cornerRadius,
  style,
}: AppMetalFxProps) {
  const metal = useAppMetalFx();

  if (typeof window !== 'undefined' && !isMetalFxSupported()) {
    return <View style={style}>{children}</View>;
  }

  return (
    <MetalFx
      variant={variant}
      preset={preset ?? metal.preset}
      theme={metal.theme}
      strength={strength ?? metal.strength}
      innerShadow={innerShadow ?? metal.innerShadow}
      paused={paused}
      borderRadius={cornerRadius}
      normalizeHostStyles={false}
      style={style as CSSProperties | undefined}>
      {children}
    </MetalFx>
  );
}
