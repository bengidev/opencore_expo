import type MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ButtonProps } from '@expo/ui/swift-ui';

/** SF Symbol name accepted by the SwiftUI primitives in `@expo/ui/swift-ui`. */
export type ComposerSymbolName = NonNullable<ButtonProps['systemImage']>;

/** Material Icons glyph name accepted by `@expo/vector-icons`. */
export type ComposerFallbackIcon = keyof typeof MaterialIcons.glyphMap;
