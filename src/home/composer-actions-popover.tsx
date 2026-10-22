import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  filterComposerActions,
  type ComposerActionItem,
} from '@/home/composer-actions';
import {
  ComposerActionsTrigger,
  type ComposerControlVariant,
} from '@/home/composer-actions-trigger';

type ComposerActionsPopoverProps = {
  items: readonly ComposerActionItem[];
  variant: ComposerControlVariant;
  onSelect: (item: ComposerActionItem) => void;
};

/** Fallback popup for web and platforms without a native container. */
export function ComposerActionsPopover({
  items,
  variant,
  onSelect,
}: ComposerActionsPopoverProps) {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [query, setQuery] = useState('');
  const visibleItems = useMemo(() => filterComposerActions(items, query), [items, query]);

  function dismiss() {
    setIsVisible(false);
    setQuery('');
  }

  return (
    <>
      <ComposerActionsTrigger variant={variant} onPress={() => setIsVisible(true)} />
      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={dismiss}>
        <Pressable style={styles.backdrop} onPress={dismiss} accessibilityLabel="Close actions">
          <Pressable
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => {}}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search actions"
              placeholderTextColor={theme.textDisabled}
              style={[styles.input, { color: theme.text, borderColor: theme.borderVisible }]}
              accessibilityLabel="Search actions"
            />
            <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              {visibleItems.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={item.title}
                  onPress={() => {
                    dismiss();
                    onSelect(item);
                  }}
                  style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
                  <AppIcon
                    ios={item.iosSymbol}
                    android={item.fallbackIcon}
                    size={20}
                    color={theme.textDisplay}
                  />
                  <View style={styles.rowText}>
                    <ThemedText variant="body" themeColor="text">
                      {item.title}
                    </ThemedText>
                    {item.subtitle ? (
                      <ThemedText variant="bodySm" themeColor="textSecondary">
                        {item.subtitle}
                      </ThemedText>
                    ) : null}
                  </View>
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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  list: {
    maxHeight: 360,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: Spacing.one,
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
