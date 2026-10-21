import type MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ButtonProps } from '@expo/ui/swift-ui';

import { HOME_MODELS } from '@/home/home-content';

/** SF Symbol name accepted by the SwiftUI primitives in `@expo/ui/swift-ui`. */
export type ComposerSymbolName = NonNullable<ButtonProps['systemImage']>;

/** Material Icons glyph name accepted by `@expo/vector-icons`. */
export type ComposerFallbackIcon = keyof typeof MaterialIcons.glyphMap;

export type ComposerActionKind = 'model' | 'action';

export type ComposerActionItem = {
  id: string;
  title: string;
  subtitle?: string;
  iosSymbol: ComposerSymbolName;
  /** Material Symbols icon name, without the `.xml` extension. */
  androidIcon: string;
  /** Material Icons glyph name, used by the React Native fallback popup. */
  fallbackIcon: ComposerFallbackIcon;
  /** Extra terms the search field should match. */
  keywords: readonly string[];
  kind: ComposerActionKind;
};

export type ComposerActionGroup = {
  id: string;
  title: string;
  items: readonly ComposerActionItem[];
};

type ModelMeta = {
  subtitle: string;
  iosSymbol: ComposerSymbolName;
  androidIcon: string;
  fallbackIcon: ComposerFallbackIcon;
  keywords: readonly string[];
};

const MODEL_META: Record<string, ModelMeta> = {
  OpenCore: {
    subtitle: 'Balanced',
    iosSymbol: 'sparkles',
    androidIcon: 'auto_awesome_mosaic',
    fallbackIcon: 'auto-awesome',
    keywords: ['default', 'balanced', 'model'],
  },
  Fast: {
    subtitle: 'Quick answers',
    iosSymbol: 'bolt.fill',
    androidIcon: 'bolt',
    fallbackIcon: 'bolt',
    keywords: ['quick', 'speed', 'model'],
  },
  Deep: {
    subtitle: 'Deep reasoning',
    iosSymbol: 'brain.head.profile',
    androidIcon: 'psychology',
    fallbackIcon: 'psychology',
    keywords: ['reasoning', 'thorough', 'model'],
  },
};

export const QUICK_ACTIONS: readonly ComposerActionItem[] = [
  {
    id: 'action:camera',
    title: 'Camera',
    subtitle: 'Take a photo',
    iosSymbol: 'camera.fill',
    androidIcon: 'camera',
    fallbackIcon: 'photo-camera',
    keywords: ['photo', 'capture', 'attach'],
    kind: 'action',
  },
  {
    id: 'action:gallery',
    title: 'Gallery',
    subtitle: 'Pick from library',
    iosSymbol: 'photo.on.rectangle',
    androidIcon: 'photo_library',
    fallbackIcon: 'photo-library',
    keywords: ['image', 'photo', 'album', 'attach'],
    kind: 'action',
  },
  {
    id: 'action:files',
    title: 'Files',
    subtitle: 'Browse documents',
    iosSymbol: 'folder',
    androidIcon: 'folder',
    fallbackIcon: 'folder',
    keywords: ['document', 'drive', 'attach'],
    kind: 'action',
  },
  {
    id: 'action:clear-input',
    title: 'Clear input',
    subtitle: 'Empty the message box',
    iosSymbol: 'xmark.circle',
    androidIcon: 'close',
    fallbackIcon: 'delete-sweep',
    keywords: ['erase', 'reset', 'empty'],
    kind: 'action',
  },
  {
    id: 'action:new-chat',
    title: 'New chat',
    subtitle: 'Start a fresh conversation',
    iosSymbol: 'bubble.left.and.bubble.right',
    androidIcon: 'chat_bubble',
    fallbackIcon: 'chat',
    keywords: ['conversation', 'start', 'reset'],
    kind: 'action',
  },
];

export function buildComposerActionGroups(): ComposerActionGroup[] {
  const models = HOME_MODELS.map((name) => {
    const meta = MODEL_META[name] ?? {
      subtitle: 'Model',
      iosSymbol: 'sparkles' as ComposerSymbolName,
      androidIcon: 'auto_awesome_mosaic',
      fallbackIcon: 'auto-awesome',
      keywords: ['model'],
    };

    return {
      id: `model:${name}`,
      title: name,
      subtitle: meta.subtitle,
      iosSymbol: meta.iosSymbol,
      androidIcon: meta.androidIcon,
      fallbackIcon: meta.fallbackIcon,
      keywords: ['model', ...meta.keywords],
      kind: 'model' as const,
    };
  });

  return [
    { id: 'models', title: 'Models', items: models },
    { id: 'quick-actions', title: 'Quick actions', items: QUICK_ACTIONS },
  ];
}

function matchesItem(item: ComposerActionItem, needle: string): boolean {
  if (item.title.toLowerCase().includes(needle)) return true;
  if (item.subtitle?.toLowerCase().includes(needle)) return true;
  return item.keywords.some((keyword) => keyword.toLowerCase().includes(needle));
}

/** Keeps only the items that match the query, and drops the groups that end up empty. */
export function filterComposerActionGroups(
  groups: readonly ComposerActionGroup[],
  query: string,
): ComposerActionGroup[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return groups.map((group) => ({ ...group }));

  return groups
    .map((group) => {
      const groupMatches = group.title.toLowerCase().includes(needle);
      const items = groupMatches
        ? [...group.items]
        : group.items.filter((item) => matchesItem(item, needle));
      return { ...group, items };
    })
    .filter((group) => group.items.length > 0);
}
