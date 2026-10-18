import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type AppBorderBeamSize = 'sm' | 'md' | 'line' | 'pulse-inner' | 'pulse-outside';

export type AppBorderBeamProps = {
  children: ReactNode;
  size?: AppBorderBeamSize;
  strength?: number;
  /** Rotation/travel duration in seconds (lower = snappier, more noticeable). */
  duration?: number;
  active?: boolean;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};
