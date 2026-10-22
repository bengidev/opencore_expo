import { BorderBeam } from 'border-beam-native';

import type { AppBorderBeamProps } from '@/components/app-border-beam.types';
import { Radius } from '@/constants/theme';
import { useAppBorderBeam } from '@/hooks/use-app-border-beam';

export function AppBorderBeam({
  children,
  size = 'md',
  strength,
  duration,
  active = true,
  borderRadius = Radius.surface,
  style,
}: AppBorderBeamProps) {
  const beam = useAppBorderBeam();

  return (
    <BorderBeam
      size={size}
      colorVariant={beam.colorVariant}
      staticColors={beam.staticColors}
      hueRange={beam.hueRange}
      saturation={beam.saturation}
      brightness={beam.brightness}
      strength={strength ?? beam.strength}
      duration={duration}
      active={active}
      theme={beam.theme}
      borderRadius={borderRadius}
      style={style}>
      {children}
    </BorderBeam>
  );
}
