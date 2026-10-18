import { Fonts, type FontRole } from '@/constants/theme';
import {
  resolveTypographyFont,
  type TypographyVariant,
} from '@/constants/typography';
import { useAppFonts } from '@/hooks/use-app-fonts';

export function useTypographyFont(variant: TypographyVariant, face?: FontRole): string | undefined {
  const [loaded, error] = useAppFonts();
  if (!loaded || error != null) {
    return undefined;
  }
  const { role } = resolveTypographyFont(variant, face);
  return Fonts[role];
}
