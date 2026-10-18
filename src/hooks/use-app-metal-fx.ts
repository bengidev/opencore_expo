import { getAppMetalFxOptions, type AppColorScheme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useAppMetalFx() {
  const scheme = (useColorScheme() ?? 'light') as AppColorScheme;
  return getAppMetalFxOptions(scheme);
}
