import { BorderBeam } from 'border-beam-native';

import type { AppBorderBeamProps } from '@/components/app-border-beam.types';
import { useAppBorderBeam } from '@/hooks/use-app-border-beam';

const SHELL_BORDER_RADIUS = 20;

export function AppBorderBeam({
  children,
  size = 'md',
  strength,
  duration,
  active = true,
  borderRadius = SHELL_BORDER_RADIUS,
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
