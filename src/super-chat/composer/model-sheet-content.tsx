import type { ComponentRef } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  MODEL_CAPABILITIES,
  defaultThinkingLevel,
  filterHomeModels,
  type HomeModel,
  type ModelCapabilityId,
  type ThinkingLevel,
} from '@/super-chat/composer/chat-models';
import {
  CapabilityTooltip,
  ModelCapabilityBadges,
  type CapabilityTooltipAnchor,
  type CapabilityTooltipContainer,
} from '@/super-chat/composer/model-capability-badges';
import {
  ROW_NAME_LINE_HEIGHT,
  ROW_TRAILING_INSET,
  THINKING_TRIGGER_GAP,
  THINKING_TRIGGER_HEIGHT,
  THINKING_TRIGGER_WIDTH,
} from '@/super-chat/composer/model-sheet-metrics';
import { ThinkingLevelControl } from '@/super-chat/composer/model-thinking-control';

type ModelSheetContentProps = {
  models: readonly HomeModel[];
  selectedId: string;
  query: string;
  /** Bumped by the sheet when it opens or closes, to clear any open overlay. */
  resetKey?: number;
  thinkingByModel: Record<string, ThinkingLevel>;
  onQueryChange: (query: string) => void;
  onThinkingChange: (modelId: string, level: ThinkingLevel) => void;
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
  resetKey = 0,
  thinkingByModel,
  onQueryChange,
  onThinkingChange,
  onSelect,
}: ModelSheetContentProps) {
  const theme = useTheme();
  const overlayRef = useRef<ComponentRef<typeof View>>(null);
  const [tooltip, setTooltip] = useState<{
    anchor: CapabilityTooltipAnchor;
    container: CapabilityTooltipContainer;
    /** The sheet generation this tooltip belongs to. */
    resetKey: number;
  } | null>(null);
  const visibleModels = useMemo(
    () => filterHomeModels(models, query),
    [models, query],
  );

  // A tooltip from a previous sheet generation stays in state but never
  // renders, so opening the sheet again cannot revive a stale overlay.
  const visibleTooltip = tooltip?.resetKey === resetKey ? tooltip : null;

  const showCapability = useCallback(
    (next: CapabilityTooltipAnchor) => {
      overlayRef.current?.measureInWindow((x, y, width, height) => {
        setTooltip({
          anchor: next,
          container: { x, y, width, height },
          resetKey,
        });
      });
    },
    [resetKey],
  );

  const dismissCapability = useCallback(() => setTooltip(null), []);

  const handleQueryChange = useCallback(
    (next: string) => {
      setTooltip(null);
      onQueryChange(next);
    },
    [onQueryChange],
  );

  const handleSelect = useCallback(
    (id: string) => {
      setTooltip(null);
      onSelect(id);
    },
    [onSelect],
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
          onChangeText={handleQueryChange}
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
        onScrollBeginDrag={dismissCapability}
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
            thinkingLevel={
              item.thinkingLevels.length > 0
                ? (thinkingByModel[item.id] ?? defaultThinkingLevel(item))
                : null
            }
            activeCapabilityId={
              visibleTooltip?.anchor.modelId === item.id
                ? visibleTooltip.anchor.capability
                : null
            }
            onThinkingChange={onThinkingChange}
            onShowCapability={showCapability}
            onSelect={handleSelect}
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

      <View ref={overlayRef} style={styles.overlay} pointerEvents="box-none">
        <CapabilityTooltip
          anchor={visibleTooltip?.anchor ?? null}
          container={visibleTooltip?.container ?? null}
          onDismiss={dismissCapability}
        />
      </View>
    </View>
  );
}

type ModelRowProps = {
  model: HomeModel;
  isSelected: boolean;
  thinkingLevel: ThinkingLevel | null;
  activeCapabilityId: ModelCapabilityId | null;
  onThinkingChange: (modelId: string, level: ThinkingLevel) => void;
  onShowCapability: (anchor: CapabilityTooltipAnchor) => void;
  onSelect: (id: string) => void;
};

function ModelRow({
  model,
  isSelected,
  thinkingLevel,
  activeCapabilityId,
  onThinkingChange,
  onShowCapability,
  onSelect,
}: ModelRowProps) {
  const theme = useTheme();
  const capabilitySummary = model.capabilities
    .map((id) => MODEL_CAPABILITIES[id].label.toLowerCase())
    .join(', ');

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: isSelected ? theme.surfaceRaised : 'transparent' },
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={model.name}
        accessibilityHint={`${model.description}. Supports ${capabilitySummary}.`}
        accessibilityState={{ selected: isSelected }}
        testID={`model-sheet-item-${model.id}`}
        onPress={() => onSelect(model.id)}
        style={({ pressed }) => [
          styles.rowMain,
          pressed && {
            backgroundColor: isSelected ? theme.surface : theme.surfaceRaised,
          },
        ]}>
        <AppIcon
          ios={model.iosSymbol}
          android={model.fallbackIcon}
          size={20}
          color={theme.textDisplay}
        />
        <View style={styles.rowText}>
          <View
            style={[
              styles.nameLine,
              {
                paddingRight: thinkingLevel
                  ? THINKING_TRIGGER_WIDTH + THINKING_TRIGGER_GAP
                  : 0,
              },
            ]}>
            <ThemedText
              variant="body"
              themeColor={isSelected ? 'textDisplay' : 'text'}
              face={isSelected ? 'sansMedium' : undefined}
              numberOfLines={1}
              style={styles.name}>
              {model.name}
            </ThemedText>
            <ModelCapabilityBadges
              model={model}
              activeCapabilityId={activeCapabilityId}
              onShowTooltip={onShowCapability}
            />
          </View>
          <ThemedText variant="caption" themeColor="textSecondary" numberOfLines={1}>
            {model.description}
          </ThemedText>
        </View>
      </Pressable>

      {thinkingLevel ? (
        <View style={styles.trailing} pointerEvents="box-none">
          <ThinkingLevelControl
            modelId={model.id}
            levels={model.thinkingLevels}
            selected={thinkingLevel}
            onSelect={(level) => onThinkingChange(model.id, level)}
          />
        </View>
      ) : null}
    </View>
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
    borderRadius: 14,
  },
  rowMain: {
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: ROW_NAME_LINE_HEIGHT,
  },
  name: {
    flexShrink: 1,
  },
  trailing: {
    position: 'absolute',
    right: ROW_TRAILING_INSET,
    // Centers the control on the name line instead of on the row.
    top: ROW_TRAILING_INSET - (THINKING_TRIGGER_HEIGHT - ROW_NAME_LINE_HEIGHT) / 2,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  empty: {
    paddingVertical: Spacing.four,
    alignItems: 'center',
  },
});
