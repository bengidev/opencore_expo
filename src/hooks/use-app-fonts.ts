import { SpaceGrotesk_400Regular } from '@expo-google-fonts/space-grotesk/400Regular';
import { SpaceGrotesk_500Medium } from '@expo-google-fonts/space-grotesk/500Medium';
import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono/400Regular';
import { useFonts } from 'expo-font';

export function useAppFonts() {
  return useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceMono_400Regular,
  });
}
