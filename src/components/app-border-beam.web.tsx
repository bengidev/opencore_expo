import { BorderBeam } from 'border-beam';
import type { CSSProperties } from 'react';

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

  const accentTintCss =
    beam.colorVariant === 'mono'
      ? `
[data-beam="{id}"]::after,
[data-beam="{id}"]::before,
[data-beam="{id}"] [data-beam-bloom] {
  filter: hue-rotate(${beam.accentHue}deg) saturate(1.35) brightness(1.12);
}
`
      : undefined;

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
      css={accentTintCss}
      style={style as CSSProperties | undefined}>
      {children}
    </BorderBeam>
  );
}
