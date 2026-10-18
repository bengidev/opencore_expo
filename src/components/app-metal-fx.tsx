import { MetalFx } from 'metal-fx-native';

import { AppMetalFxFallback } from '@/components/app-metal-fx-fallback';
import type { AppMetalFxProps } from '@/components/app-metal-fx.types';
import { useAppMetalFx } from '@/hooks/use-app-metal-fx';

export function AppMetalFx({
  children,
  variant = 'circle',
  preset,
  strength,
  innerShadow,
  paused = false,
  tilt,
  cornerRadius,
  fill,
  style,
}: AppMetalFxProps) {
  const metal = useAppMetalFx();

  return (
    <AppMetalFxFallback style={style} render={
      <MetalFx
        variant={variant}
        preset={preset ?? metal.preset}
        theme={metal.theme}
        strength={strength ?? metal.strength}
        innerShadow={innerShadow ?? metal.innerShadow}
        paused={paused}
        tilt={tilt ?? metal.tilt}
        cornerRadius={cornerRadius}
        fill={fill}
        style={style}>
        {children}
      </MetalFx>
    }>
      {children}
    </AppMetalFxFallback>
  );
}
