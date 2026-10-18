import {
  getAppBorderBeamAccentHue,
  getAppBorderBeamOptions,
  type AppColorScheme,
} from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

export function useAppBorderBeam() {
  const scheme = useColorScheme() as AppColorScheme;
  const colors = useTheme();
  const beam = getAppBorderBeamOptions(scheme);

  return {
    ...beam,
    accentHue: getAppBorderBeamAccentHue(colors),
    colors,
  };
}
