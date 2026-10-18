import { Fonts, type FontRole } from '@/constants/theme';
import { useAppFonts } from '@/hooks/use-app-fonts';

export function useFontFamily(role: FontRole): string | undefined {
  const [loaded, error] = useAppFonts();
  if (!loaded || error != null) {
    return undefined;
  }
  return Fonts[role];
}
