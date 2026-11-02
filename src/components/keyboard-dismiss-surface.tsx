import type { ReactNode } from 'react';
import { Keyboard, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

/** Puts the keyboard away. Exposed so a screen's own backdrop can share it. */
export function dismissKeyboard() {
  Keyboard.dismiss();
}

export type KeyboardDismissSurfaceProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Dismisses the keyboard when the user taps the screen outside a control.
 *
 * Neither iOS nor Android resigns the first responder on an outside tap by
 * itself, and a `ScrollView` only covers the area it scrolls, so every screen
 * with a text field wraps its content in this surface. A nested control still
 * wins the touch and keeps its own behaviour (send, suggestions, inputs); any
 * tap on plain background bubbles up to here and closes the keyboard.
 */
export function KeyboardDismissSurface({ children, style }: KeyboardDismissSurfaceProps) {
  return (
    <Pressable
      accessible={false}
      onPress={dismissKeyboard}
      style={[styles.surface, style]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  surface: {
    flex: 1,
  },
});
