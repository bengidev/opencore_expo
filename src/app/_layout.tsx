import '../global.css';

// Must run before the first `Asset.fromModule()` call, i.e. before `useAppFonts`.
import '@/lib/asset-registry-shim';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { useAppFonts } from '@/hooks/use-app-fonts';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Fast refresh can call this after the splash is already gone.
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
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
      <KeyboardProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="api-key"
            options={{ presentation: 'modal', title: 'OpenRouter API key' }}
          />
          <Stack.Screen
            name="thinking-orb"
            options={{ presentation: 'modal', title: 'Thinking orb' }}
          />
        </Stack>
      </KeyboardProvider>
    </ThemeProvider>
  );
}
