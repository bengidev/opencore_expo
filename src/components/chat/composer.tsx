import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { useFontFamily } from '@/hooks/use-font-family';
import { useTheme } from '@/hooks/use-theme';

export function Composer({ onSend }: { onSend: (text: string) => void }) {
  const theme = useTheme();
  const sans = useFontFamily('sansMedium');
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
          borderTopColor: theme.border,
          paddingBottom: Math.max(insets.bottom, Spacing.two),
        },
      ]}>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        placeholder="Tulis pesan"
        placeholderTextColor={theme.textDisabled}
        multiline
        style={[
          styles.input,
          Typography.body,
          {
            color: theme.text,
            fontFamily: sans,
            backgroundColor: theme.surface,
            borderColor: theme.borderVisible,
          },
        ]}
        accessibilityLabel="Pesan"
      />
      <Pressable
        onPress={send}
        disabled={!trimmed}
        accessibilityRole="button"
        accessibilityLabel="Kirim pesan"
        style={[
          styles.send,
          { backgroundColor: trimmed ? theme.textDisplay : 'transparent' },
        ]}>
        <ThemedText type="code" themeColor={trimmed ? 'background' : 'textDisabled'}>
          KIRIM
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
    borderTopWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  send: {
    minHeight: 44,
    borderRadius: 999,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
