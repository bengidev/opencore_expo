import { Shimmer } from 'panelui-native/components/shimmer';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ModelCatalogStatus } from '@/super-chat/llm/use-model-catalog';

type ModelSheetStatusProps = {
  status: ModelCatalogStatus;
  /** Why the catalogue fell back, shown under the fixed caption. */
  error: string | null;
  onRetry: () => void;
};

/**
 * The catalogue's non-row states, shared by every sheet platform so there is
 * one copy of the copy and one skeleton. Renders nothing once the list is live.
 */
export function ModelSheetStatus({ status, error, onRetry }: ModelSheetStatusProps) {
  if (status === 'loading') {
    return <ModelSkeletonRows />;
  }
  if (status !== 'fallback') {
    return null;
  }

  return (
    <View style={styles.fallback}>
      <View style={styles.copy}>
        <ThemedText
          variant="caption"
          themeColor="textSecondary"
          maxFontSizeMultiplier={1.6}>
          {"Couldn't load the live catalogue."}
        </ThemedText>
        {error !== null && error !== '' ? (
          <ThemedText
            variant="caption"
            themeColor="textDisabled"
            numberOfLines={2}
            maxFontSizeMultiplier={1.6}>
            {error}
          </ThemedText>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        testID="model-sheet-retry"
        hitSlop={8}
        style={({ pressed }) => [styles.retry, pressed && { opacity: 0.6 }]}>
        <ThemedText variant="label" themeColor="textDisplay">
          Try again
        </ThemedText>
      </Pressable>
    </View>
  );
}

/** Three quiet placeholder rows while the live catalogue is in flight. */
function ModelSkeletonRows() {
  const theme = useTheme();
  return (
    <Shimmer
      as="view"
      duration={1400}
      baseColor={theme.surfaceRaised}
      shimmerColor={theme.surface}
      style={styles.skeleton}>
      {[0, 1, 2].map((row) => (
        <View key={row} style={styles.skeletonRow}>
          <View style={[styles.skeletonIcon, { backgroundColor: theme.surfaceRaised }]} />
          <View style={styles.skeletonText}>
            <View style={[styles.skeletonName, { backgroundColor: theme.surfaceRaised }]} />
            <View style={[styles.skeletonLine, { backgroundColor: theme.surfaceRaised }]} />
          </View>
        </View>
      ))}
    </Shimmer>
  );
}

const styles = StyleSheet.create({
  fallback: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingBottom: Spacing.two,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  retry: {
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  skeleton: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.two,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  skeletonIcon: {
    width: 20,
    height: 20,
    borderRadius: 6,
  },
  skeletonText: {
    flex: 1,
    gap: 6,
  },
  skeletonName: {
    width: '45%',
    height: 14,
    borderRadius: 7,
  },
  skeletonLine: {
    width: '80%',
    height: 10,
    borderRadius: 5,
  },
});
