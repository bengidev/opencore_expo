import type { ComposerFallbackIcon, ComposerSymbolName } from '@/super-chat/composer/symbols';

export type HomeModel = {
  id: string;
  name: string;
  /** One-line summary shown under the name inside the model sheet. */
  description: string;
  /** SF Symbol shown next to the model name. */
  iosSymbol: ComposerSymbolName;
  /** Material Symbols icon name, without the `.xml` extension. */
  androidIcon: HomeModelAndroidIcon;
  /** Material Icons glyph name, used by the React Native fallback. */
  fallbackIcon: ComposerFallbackIcon;
  /** Extra terms the search field should match. */
  keywords: readonly string[];
  /** `false` marks a placeholder row that only exists to exercise the sheet UI. */
  isLive: boolean;
};

/** Material Symbols used by the native Android trigger. */
export type HomeModelAndroidIcon =
  | 'auto_awesome_mosaic'
  | 'bolt'
  | 'psychology'
  | 'image_search'
  | 'code'
  | 'globe'
  | 'edit_note'
  | 'analytics'
  | 'shield';

/** Models offered by the composer, in the order they are presented. */
export const HOME_MODELS: readonly HomeModel[] = [
  {
    id: 'opencore',
    name: 'OpenCore',
    description: 'Balanced default for everyday questions',
    iosSymbol: 'sparkles',
    androidIcon: 'auto_awesome_mosaic',
    fallbackIcon: 'auto-awesome',
    keywords: ['default', 'balanced', 'general'],
    isLive: true,
  },
  {
    id: 'fast',
    name: 'Fast',
    description: 'Low-latency answers for quick replies',
    iosSymbol: 'bolt.fill',
    androidIcon: 'bolt',
    fallbackIcon: 'bolt',
    keywords: ['quick', 'latency', 'snappy'],
    isLive: true,
  },
  {
    id: 'deep',
    name: 'Deep',
    description: 'Long-form reasoning with more context',
    iosSymbol: 'brain.head.profile',
    androidIcon: 'psychology',
    fallbackIcon: 'psychology',
    keywords: ['reasoning', 'long', 'thoughtful'],
    isLive: true,
  },
];

/**
 * Placeholder models. They give the sheet a list worth scrolling and filtering
 * while the real catalogue is still being built — swap them for the API
 * response without touching the sheet itself.
 */
export const HOME_MODEL_PREVIEWS: readonly HomeModel[] = [
  {
    id: 'preview-vision',
    name: 'Vision',
    description: 'Reads screenshots, photos and scans',
    iosSymbol: 'square.stack.3d.up.fill',
    androidIcon: 'image_search',
    fallbackIcon: 'image-search',
    keywords: ['image', 'photo', 'screenshot', 'ocr', 'document'],
    isLive: false,
  },
  {
    id: 'preview-coder',
    name: 'Coder',
    description: 'Writes, refactors and reviews source files',
    iosSymbol: 'terminal',
    androidIcon: 'code',
    fallbackIcon: 'code',
    keywords: ['code', 'programming', 'debug', 'review', 'repository'],
    isLive: false,
  },
  {
    id: 'preview-research',
    name: 'Research',
    description: 'Cites sources across the open web',
    iosSymbol: 'globe',
    androidIcon: 'globe',
    fallbackIcon: 'public',
    keywords: ['search', 'web', 'sources', 'browse', 'cite'],
    isLive: false,
  },
  {
    id: 'preview-writer',
    name: 'Writer',
    description: 'Drafts posts, docs and release notes',
    iosSymbol: 'text.bubble.fill',
    androidIcon: 'edit_note',
    fallbackIcon: 'edit-note',
    keywords: ['draft', 'copy', 'prose', 'notes', 'editor'],
    isLive: false,
  },
  {
    id: 'preview-analyst',
    name: 'Analyst',
    description: 'Turns raw numbers into a readable story',
    iosSymbol: 'chart.bar.fill',
    androidIcon: 'analytics',
    fallbackIcon: 'analytics',
    keywords: ['data', 'chart', 'metrics', 'report', 'insight'],
    isLive: false,
  },
  {
    id: 'preview-guard',
    name: 'Guard',
    description: 'Reviews diffs before they reach main',
    iosSymbol: 'shield.lefthalf.filled',
    androidIcon: 'shield',
    fallbackIcon: 'security',
    keywords: ['review', 'safety', 'diff', 'security', 'audit'],
    isLive: false,
  },
];

/** Every row the model sheet can show: the live models first, previews after. */
export const HOME_MODEL_SHEET_ITEMS: readonly HomeModel[] = [
  ...HOME_MODELS,
  ...HOME_MODEL_PREVIEWS,
];

export const DEFAULT_HOME_MODEL_ID = HOME_MODELS[0].id;

function matchesModel(model: HomeModel, needle: string): boolean {
  if (model.name.toLowerCase().includes(needle)) return true;
  if (model.description.toLowerCase().includes(needle)) return true;
  return model.keywords.some((keyword) => keyword.toLowerCase().includes(needle));
}

/** Keeps only the models that match the query. */
export function filterHomeModels(
  models: readonly HomeModel[],
  query: string,
): HomeModel[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...models];

  return models.filter((model) => matchesModel(model, needle));
}
