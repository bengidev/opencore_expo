import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { hasNativeChrome, isAndroidMaterial } from '@/lib/ui-tier';

const threadOptions = {
  title: 'OpenCore',
  // Chats are opened from Home and from the Chats tab, so the back label cannot
  // name one tab.
  headerBackTitle: 'Back',
  // Android draws its own Material 3 app bar in Compose — the native header
  // reserves the status-bar inset twice on some devices, leaving the title in
  // the middle of a tall white slab (react-native-screens#4737).
  headerShown: !isAndroidMaterial,
};

export default function ChatsLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = Colors[scheme];
  const header = isAndroidMaterial ? null : (
    <Stack.Header
      style={{
        color: colors.text,
        shadowColor: 'transparent',
        // The native tiers draw their own bar material — the iOS 26 glass bar
        // and Android's Compose app bar — so the app only paints a background
        // where no native bar exists.
        ...(hasNativeChrome ? null : { backgroundColor: colors.background }),
      }}
    />
  );

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" options={threadOptions}>
        {header}
      </Stack.Screen>
      <Stack.Screen name="new" options={threadOptions}>
        {header}
      </Stack.Screen>
    </Stack>
  );
}
