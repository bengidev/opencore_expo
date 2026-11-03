import { Host, Icon, IconButton, Text, TopAppBar } from '@expo/ui/jetpack-compose';
import { fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { useMaterialTheme } from '@/hooks/use-material-theme';

/**
 * Material 3 app bar for the Android stack.
 *
 * This is a real `TopAppBar`, not a React Native view styled like one: Compose
 * draws the container in the palette's surface role, applies the status-bar
 * inset itself through `TopAppBarDefaults.windowInsets`, renders the navigation
 * icon as a 48dp `IconButton` with its ripple, and sets the title in
 * `titleLarge`. Native chrome is the point of the Android tier, the same way
 * iOS uses the system header.
 *
 * The chat screen is a child destination, so the bar always offers the up
 * affordance, like a Material top app bar on a pushed screen — including when
 * the route was opened directly by a deep link and there is no history to pop.
 * Up is Home, the parent destination, so the onboarding route a deep link
 * stacks underneath never becomes the target.
 *
 * The reason it lives here instead of in the navigator: `react-native-screens`
 * sizes the native header container as `topInset + toolbar`, while the toolbar
 * already pads itself by that inset, so on some Android builds the title ends
 * up in the middle of a tall white slab and content starts one status bar too
 * low (software-mansion/react-native-screens#4737, closed without a fix). A bar
 * this screen owns applies the inset exactly once, by construction.
 */
export function AndroidAppBar({ title }: { title: string }) {
  const material = useMaterialTheme();

  function handleUp() {
    // Up is the parent destination, not "whatever the deep link stacked
    // underneath": `dismissTo` pops back to Home when it is in the stack and
    // replaces the chat with it when it is not.
    router.dismissTo('/home');
  }

  return (
    <Host
      matchContents={{ vertical: true }}
      colorScheme={material.colorScheme}
      colorOverrides={material.colorOverrides}
      style={styles.host}>
      <TopAppBar modifiers={[fillMaxWidth(1)]}>
        <TopAppBar.NavigationIcon>
          <IconButton onClick={handleUp}>
            <Icon
              contentDescription="Navigate up"
              size={24}
              source={require('@expo/material-symbols/arrow_back.xml')}
            />
          </IconButton>
        </TopAppBar.NavigationIcon>
        <TopAppBar.Title>
          <Text style={{ typography: 'titleLarge' }}>{title}</Text>
        </TopAppBar.Title>
      </TopAppBar>
    </Host>
  );
}

const styles = StyleSheet.create({
  /** The bar spans the window; Compose owns its height, inset included. */
  host: {
    width: '100%',
  },
});
