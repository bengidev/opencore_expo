import { NativeTabs } from 'expo-router/native-tabs';

import { useTheme } from '@/hooks/use-theme';

/**
 * The app's primary navigation, drawn by the platform: a UITabBarController
 * with Liquid Glass on iOS 26+, a Material 3 navigation bar on Android, and a
 * DOM tab list on web. The tab bar is monochrome on purpose: the red accent
 * belongs to the hero, not to navigation.
 */
export default function TabsLayout() {
  const theme = useTheme();

  return (
    <NativeTabs
      backgroundColor={theme.surface}
      tintColor={theme.textDisplay}
      iconColor={theme.textSecondary}
      labelStyle={{
        default: { color: theme.textSecondary },
        selected: { color: theme.textDisplay },
      }}
      indicatorColor={theme.surfaceRaised}
      rippleColor={theme.borderVisible}>
      <NativeTabs.Trigger name="home" testID="tab-home">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="chats" testID="tab-chats">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'bubble.left.and.bubble.right', selected: 'bubble.left.and.bubble.right.fill' }}
          md="forum"
        />
        <NativeTabs.Trigger.Label>Chats</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings" testID="tab-settings">
        <NativeTabs.Trigger.Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} md="settings" />
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
