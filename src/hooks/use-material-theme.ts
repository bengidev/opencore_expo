import { useMemo } from 'react';

import type { AppColorScheme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getMaterialColorOverrides } from '@/lib/material-colors';

/**
 * Props that put a Compose `Host` on the app palette.
 *
 * `colorScheme` pins the tier to the app's mode — without it Compose follows the
 * device, so a light app on a dark device would draw a dark Material sheet —
 * and `colorOverrides` replaces Material You's roles with the palette's own.
 */
export function useMaterialTheme() {
  const scheme: AppColorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';

  return useMemo(
    () => ({ colorScheme: scheme, colorOverrides: getMaterialColorOverrides(scheme) }),
    [scheme],
  );
}
