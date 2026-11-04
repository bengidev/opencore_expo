import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Host, Icon, IconButton, Text, TopAppBar } from '@expo/ui/jetpack-compose';
import { fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text as NativeText, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, Spacing } from '@/constants/theme';
import { useMaterialTheme } from '@/hooks/use-material-theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Whether this binary actually registered the Compose `TopAppBarView`.
 *
 * `@expo/ui` ships the JS component in the package, but the native view only
 * exists after the app is rebuilt with that version. An older development
 * build therefore renders a "Can't find ViewManager" red box when the JS calls
 * `TopAppBar`. `globalThis.expo.getViewConfig` is the same check Expo's
 * `requireNativeView` uses, so it tells us whether the native view is present
 * before we render it.
 */
function hasComposeTopAppBar(): boolean {
  const expo = (
    globalThis as {
      expo?: { getViewConfig?: (moduleName: string, viewName?: string) => unknown };
    }
  ).expo;

  try {
    return expo?.getViewConfig?.('ExpoUI', 'TopAppBarView') != null;
  } catch {
    return false;
  }
}

/**
 * Material 3 app bar for the Android stack.
 *
 * On a current build this is a real `TopAppBar`: Compose draws the container in
 * the palette's surface role, applies the status-bar inset itself through
 * `TopAppBarDefaults.windowInsets`, renders the navigation icon as a 48dp
 * `IconButton` with its ripple, and sets the title in `titleLarge`. Native
 * chrome is the point of the Android tier, the same way iOS uses the system
 * header.
 *
 * When the installed binary predates `TopAppBar`, the JS falls back to a small
 * React Native bar with the same height and inset. That keeps older development
 * builds usable until they are rebuilt; the native bar returns automatically
 * once `TopAppBarView` is registered.
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
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  function handleUp() {
    // Up is the parent destination, not "whatever the deep link stacked
    // underneath": `dismissTo` pops back to Home when it is in the stack and
    // replaces the chat with it when it is not.
    router.dismissTo('/home');
  }

  if (!hasComposeTopAppBar()) {
    return (
      <View
        style={[
          styles.fallbackBar,
          {
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
            paddingTop: insets.top,
          },
        ]}>
        <View style={styles.fallbackRow}>
          <Pressable
            accessibilityLabel="Navigate up"
            accessibilityRole="button"
            android_ripple={{ borderless: true, color: theme.border }}
            onPress={handleUp}
            style={({ pressed }) => [
              styles.fallbackButton,
              pressed && { backgroundColor: theme.surfaceRaised },
            ]}>
            <MaterialIcons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <NativeText
            numberOfLines={1}
            style={[styles.fallbackTitle, { color: theme.text }]}>
            {title}
          </NativeText>
        </View>
      </View>
    );
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
  fallbackBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    width: '100%',
  },
  fallbackRow: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 64,
    paddingHorizontal: Spacing.one,
  },
  fallbackButton: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  fallbackTitle: {
    flex: 1,
    fontFamily: Fonts.sansMedium,
    fontSize: 22,
    letterSpacing: 0,
    lineHeight: 28,
    marginLeft: Spacing.two,
  },
});
