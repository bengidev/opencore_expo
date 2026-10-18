import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { useTheme } from '@/hooks/use-theme';

type HomeHeaderProps = {
  onMenuPress?: () => void;
};

export function HomeHeader({ onMenuPress }: HomeHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={12}
        onPress={() => router.back()}
        style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}>
        <AppIcon ios="chevron.left" android="chevron-left" size={22} color={theme.textDisplay} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Menu"
        hitSlop={12}
        onPress={onMenuPress}
        style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}>
        <AppIcon ios="line.3.horizontal" android="menu" size={22} color={theme.textDisplay} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
