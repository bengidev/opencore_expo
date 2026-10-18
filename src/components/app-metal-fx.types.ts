import type { ReactElement } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { AppMetalFxPreset } from '@/constants/theme';

export type AppMetalFxVariant = 'button' | 'circle';

export type AppMetalFxProps = {
  children: ReactElement;
  variant?: AppMetalFxVariant;
  preset?: AppMetalFxPreset;
  strength?: number;
  innerShadow?: boolean;
  paused?: boolean;
  tilt?: boolean;
  cornerRadius?: number;
  fill?: string;
  style?: StyleProp<ViewStyle>;
};
