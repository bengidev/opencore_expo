import type { ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

type TabScreenProps = {
  eyebrow: string;
  title: string;
  children: ReactNode;
};

/**
 * Page frame for a tab: a display-font title over a scrolling column.
 *
 * The bar itself is native, so the screen does not fake its insets. On iOS the
 * first scroll view keeps `automatic` content inset adjustment, which the tab
 * controller grows by exactly the tab bar height. On Android the router already
 * wraps tab content in a `SafeAreaView` with the bottom edge, so only the top
 * inset is left for the header to take.
 */
export function TabScreen({ eyebrow, title, children }: TabScreenProps) {
  const insets = useSafeAreaInsets();
  const androidTopInset = Platform.OS === 'android' ? insets.top : 0;

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.column}>
          <View style={[styles.header, { paddingTop: Spacing.four + androidTopInset }]}>
            <ThemedText variant="label" themeColor="textSecondary">
              {eyebrow}
            </ThemedText>
            <ThemedText variant="displayMd" themeColor="textDisplay" accessibilityRole="header">
              {title}
            </ThemedText>
          </View>
          {children}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.four,
    alignItems: 'center',
  },
  column: {
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  header: {
    gap: Spacing.one,
    paddingBottom: Spacing.four,
  },
});
