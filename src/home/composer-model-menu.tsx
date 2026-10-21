import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ComposerControlVariant } from '@/home/composer-actions-trigger';
import type { HomeModel } from '@/home/home-models';

type ComposerModelMenuProps = {
  models: readonly HomeModel[];
  selectedId: string;
  variant: ComposerControlVariant;
  onSelect: (id: string) => void;
};

/** Fallback model picker for web and platforms without a native menu. */
export function ComposerModelMenu({
  models,
  selectedId,
  variant,
  onSelect,
}: ComposerModelMenuProps) {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const selected = models.find((model) => model.id === selectedId) ?? models[0];

  function dismiss() {
    setIsVisible(false);
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Model, ${selected.name}`}
        testID="composer-model-trigger"
        onPress={() => setIsVisible(true)}
        style={({ pressed }) => [
          styles.chip,
          {
            borderColor: theme.borderVisible,
            backgroundColor: variant === 'glass' ? theme.surface : theme.surfaceRaised,
          },
          pressed && { opacity: 0.7 },
        ]}>
        <AppIcon
          ios={selected.iosSymbol}
          android={selected.fallbackIcon}
          size={16}
          color={theme.text}
        />
        <ThemedText variant="bodySm" themeColor="text">
          {selected.name}
        </ThemedText>
        <AppIcon
          ios="chevron.down"
          android="keyboard-arrow-down"
          size={16}
          color={theme.textSecondary}
        />
      </Pressable>
      <Modal visible={isVisible} transparent animationType="fade" onRequestClose={dismiss}>
        <Pressable style={styles.backdrop} onPress={dismiss} accessibilityLabel="Close models">
          <Pressable
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => {}}>
            <ScrollView style={styles.list}>
              {models.map((model) => (
                <Pressable
                  key={model.id}
                  accessibilityRole="button"
                  accessibilityLabel={model.name}
                  accessibilityState={{ selected: model.id === selectedId }}
                  onPress={() => {
                    dismiss();
                    onSelect(model.id);
                  }}
                  style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
                  <AppIcon
                    ios={model.iosSymbol}
                    android={model.fallbackIcon}
                    size={20}
                    color={theme.textDisplay}
                  />
                  <View style={styles.rowText}>
                    <ThemedText variant="body" themeColor="text">
                      {model.name}
                    </ThemedText>
                  </View>
                  {model.id === selectedId ? (
                    <AppIcon ios="checkmark" android="check" size={18} color={theme.textDisplay} />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: Spacing.two,
    height: 36,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.two,
  },
  list: {
    maxHeight: 320,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  rowText: {
    flex: 1,
  },
});
