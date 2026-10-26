import '../global.css';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { useIosLiquidGlass } from '@/components/liquid-glass-view';
import { Colors } from '@/constants/theme';
import { useAppFonts } from '@/hooks/use-app-fonts';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Fast refresh can call this after the splash is already gone.
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[scheme];
  const iosGlass = useIosLiquidGlass();
  const [loaded, error] = useAppFonts();

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="home" options={{ headerShown: false, title: 'Home' }} />
        <Stack.Screen name="super-chat" options={{ title: 'OpenCore', headerBackTitle: 'Home' }}>
          <Stack.Header
            style={{
              color: colors.text,
              shadowColor: 'transparent',
              ...(iosGlass ? null : { backgroundColor: colors.background }),
            }}
          />
        </Stack.Screen>
      </Stack>
    </ThemeProvider>
  );
}
