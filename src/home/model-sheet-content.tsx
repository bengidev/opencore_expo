import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { filterHomeModels, type HomeModel } from '@/home/home-models';

type ModelSheetContentProps = {
  models: readonly HomeModel[];
  selectedId: string;
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (id: string) => void;
};

/**
 * Body of the model sheet: a search field and the model list. Plain React
 * Native so the same tree runs inside the native sheet on iOS, Android and
 * the web. The sheet is resized by dragging its native grabber.
 */
export function ModelSheetContent({
  models,
  selectedId,
  query,
  onQueryChange,
  onSelect,
}: ModelSheetContentProps) {
  const theme = useTheme();
  const visibleModels = useMemo(
    () => filterHomeModels(models, query),
    [models, query],
  );

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.search,
          { backgroundColor: theme.surfaceRaised, borderColor: theme.border },
        ]}>
        <AppIcon ios="magnifyingglass" android="search" size={18} color={theme.textSecondary} />
        <TextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder="Search models"
          placeholderTextColor={theme.textDisabled}
          style={[styles.searchInput, { color: theme.text }]}
          accessibilityLabel="Search models"
          testID="model-sheet-search"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={visibleModels}
        keyExtractor={(model) => model.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <ThemedText variant="subheading" themeColor="textDisplay">
              Select a model
            </ThemedText>
            <ThemedText variant="caption" themeColor="textSecondary">
              Sets the speed and depth of every reply.
            </ThemedText>
          </View>
        }
        renderItem={({ item }) => (
          <ModelRow
            model={item}
            isSelected={item.id === selectedId}
            onSelect={onSelect}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <ThemedText variant="bodySm" themeColor="textSecondary">
              No models match “{query.trim()}”.
            </ThemedText>
          </View>
        }
      />
    </View>
  );
}

type ModelRowProps = {
  model: HomeModel;
  isSelected: boolean;
  onSelect: (id: string) => void;
};

function ModelRow({ model, isSelected, onSelect }: ModelRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={model.name}
      accessibilityState={{ selected: isSelected }}
      testID={`model-sheet-item-${model.id}`}
      onPress={() => onSelect(model.id)}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: isSelected ? theme.surfaceRaised : 'transparent' },
        pressed && { opacity: 0.6 },
      ]}>
      <AppIcon
        ios={model.iosSymbol}
        android={model.fallbackIcon}
        size={20}
        color={theme.textDisplay}
      />
      <View style={styles.rowText}>
        <ThemedText
          variant="body"
          themeColor={isSelected ? 'textDisplay' : 'text'}
          face={isSelected ? 'sansMedium' : undefined}>
          {model.name}
        </ThemedText>
        <ThemedText variant="caption" themeColor="textSecondary" numberOfLines={1}>
          {model.description}
        </ThemedText>
      </View>
      {!model.isLive ? (
        <View style={[styles.tag, { borderColor: theme.borderVisible }]}>
          <ThemedText variant="label" themeColor="textSecondary">
            Preview
          </ThemedText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: Spacing.two,
    height: 44,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing.three,
  },
  listHeader: {
    gap: Spacing.one,
    paddingBottom: Spacing.two,
    // Lines the title up with the row icons, not with the full-width search field.
    paddingHorizontal: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: 14,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.one,
    paddingVertical: 2,
  },
  empty: {
    paddingVertical: Spacing.four,
    alignItems: 'center',
  },
});
