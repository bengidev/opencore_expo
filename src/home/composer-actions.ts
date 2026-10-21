import type { ComposerFallbackIcon, ComposerSymbolName } from '@/home/symbols';
import { HOME_MODELS } from '@/home/home-models';

export type ComposerActionKind = 'model' | 'action';

export type ComposerActionItem = {
  id: string;
  title: string;
  subtitle?: string;
  /** SF Symbol shown next to the action title. */
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
  const models = HOME_MODELS.map((model) => ({
    id: `model:${model.id}`,
    title: model.name,
    subtitle: model.subtitle,
    iosSymbol: model.iosSymbol,
    androidIcon: model.androidIcon,
    fallbackIcon: model.fallbackIcon,
    keywords: ['model', ...model.keywords],
    kind: 'model' as const,
  }));

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
