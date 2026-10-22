import type { ComposerFallbackIcon, ComposerSymbolName } from '@/home/symbols';

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
  },
  {
    id: 'action:gallery',
    title: 'Gallery',
    subtitle: 'Pick from library',
    iosSymbol: 'photo.on.rectangle',
    androidIcon: 'photo_library',
    fallbackIcon: 'photo-library',
    keywords: ['image', 'photo', 'album', 'attach'],
  },
  {
    id: 'action:files',
    title: 'Files',
    subtitle: 'Browse documents',
    iosSymbol: 'folder',
    androidIcon: 'folder',
    fallbackIcon: 'folder',
    keywords: ['document', 'drive', 'attach'],
  },
  {
    id: 'action:clear-input',
    title: 'Clear input',
    subtitle: 'Empty the message box',
    iosSymbol: 'xmark.circle',
    androidIcon: 'close',
    fallbackIcon: 'delete-sweep',
    keywords: ['erase', 'reset', 'empty'],
  },
  {
    id: 'action:new-chat',
    title: 'New chat',
    subtitle: 'Start a fresh conversation',
    iosSymbol: 'bubble.left.and.bubble.right',
    androidIcon: 'chat_bubble',
    fallbackIcon: 'chat',
    keywords: ['conversation', 'start', 'reset'],
  },
];

function matchesItem(item: ComposerActionItem, needle: string): boolean {
  if (item.title.toLowerCase().includes(needle)) return true;
  if (item.subtitle?.toLowerCase().includes(needle)) return true;
  return item.keywords.some((keyword) => keyword.toLowerCase().includes(needle));
}

/** Keeps only the actions that match the query. */
export function filterComposerActions(
  items: readonly ComposerActionItem[],
  query: string,
): ComposerActionItem[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...items];

  return items.filter((item) => matchesItem(item, needle));
}
