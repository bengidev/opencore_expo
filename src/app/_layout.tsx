import '../global.css';

// Must run before the first `Asset.fromModule()` call, i.e. before `useAppFonts`.
import '@/lib/asset-registry-shim';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { Colors } from '@/constants/theme';
import { useAppFonts } from '@/hooks/use-app-fonts';
import { hasNativeChrome } from '@/lib/ui-tier';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Fast refresh can call this after the splash is already gone.
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[scheme];
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
          <Stack.Screen name="home" options={{ headerShown: false, title: 'Home' }} />
          <Stack.Screen name="super-chat" options={{ title: 'OpenCore', headerBackTitle: 'Home' }}>
            <Stack.Header
              style={{
                color: colors.text,
                shadowColor: 'transparent',
                // The native tiers draw their own bar material — the iOS 26 glass
                // bar and the Material app bar — so the app only paints a
                // background where no native bar exists.
                ...(hasNativeChrome ? null : { backgroundColor: colors.background }),
              }}
            />
          </Stack.Screen>
        </Stack>
      </KeyboardProvider>
    </ThemeProvider>
  );
}
