import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Composer({ onSend }: { onSend: (text: string) => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const trimmed = draft.trim();

  function send() {
    if (!trimmed) {
      return;
    }
    onSend(trimmed);
    setDraft('');
  }

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: theme.background,
          borderTopColor: theme.backgroundSelected,
          paddingBottom: Math.max(insets.bottom, Spacing.two),
        },
      ]}>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        placeholder="Tulis pesan"
        placeholderTextColor={theme.textSecondary}
        multiline
        style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
        accessibilityLabel="Pesan"
      />
      <Pressable
        onPress={send}
        disabled={!trimmed}
        accessibilityRole="button"
        accessibilityLabel="Kirim pesan"
        style={[styles.send, { backgroundColor: trimmed ? theme.accent : theme.backgroundSelected }]}>
        <ThemedText type="smallBold" themeColor={trimmed ? 'onAccent' : 'textSecondary'}>
          Kirim
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  send: {
    minHeight: 44,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
