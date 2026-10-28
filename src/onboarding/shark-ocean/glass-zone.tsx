import { createContext, useCallback, useContext, useEffect, useId, useRef, type ReactNode } from 'react';
import { View, type StyleProp, type ViewInstance, type ViewStyle } from 'react-native';

import type { GlassZone } from './types';

export type RegisterGlassZone = (id: string, zone: GlassZone | null) => void;

export const GlassZoneContext = createContext<RegisterGlassZone | null>(null);

export function SharkGlass({
  children,
  radius = 24,
  style,
}: {
  children: ReactNode;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const register = useContext(GlassZoneContext);
  const ref = useRef<ViewInstance>(null);
  const id = useId();

  const report = useCallback(() => {
    ref.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) {
        register?.(id, { x, y, width, height, radius });
      }
    });
  }, [id, radius, register]);

  useEffect(() => () => register?.(id, null), [id, register]);

  return (
    <View ref={ref} onLayout={report} style={style} pointerEvents="box-none">
      {children}
    </View>
  );
}
