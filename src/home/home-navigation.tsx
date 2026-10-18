import { Button, Icon } from '@expo/ui';
import { MenuView } from '@expo/ui/community/menu';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ExpoUiHost } from '@/components/expo-ui-host';
import { HOME_SYMBOLS } from '@/home/home-symbols';
import { useTheme } from '@/hooks/use-theme';

const MENU_ACTIONS = [
  { id: 'history', title: 'History', image: 'clock' as const },
  { id: 'settings', title: 'Settings', image: 'gearshape' as const },
];

export function HomeHeaderBack() {
  const theme = useTheme();

  return (
    <View style={styles.slot}>
      <ExpoUiHost>
        <Button variant="text" onPress={() => router.back()} testID="home-back" style={styles.iconButton}>
          <Icon name={HOME_SYMBOLS.back} size={22} color={theme.textDisplay} />
        </Button>
      </ExpoUiHost>
    </View>
  );
}

export function HomeHeaderMenu() {
  const theme = useTheme();

  return (
    <View style={styles.slot}>
      <MenuView
        actions={MENU_ACTIONS}
        onPressAction={() => {}}
        testID="home-menu">
        <ExpoUiHost>
          <Button variant="text" testID="home-menu-trigger" style={styles.iconButton}>
            <Icon name={HOME_SYMBOLS.menu} size={22} color={theme.textDisplay} />
          </Button>
        </ExpoUiHost>
      </MenuView>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
  },
});
