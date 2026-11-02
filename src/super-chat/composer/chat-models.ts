import type { ComposerFallbackIcon, ComposerSymbolName } from '@/super-chat/composer/symbols';

/** What a model can take in and work with. Rendered as badges in the sheet. */
export type ModelCapabilityId =
  | 'text'
  | 'image'
  | 'documents'
  | 'code'
  | 'web'
  | 'reasoning'
  | 'audio'
  | 'video';

export type ModelCapability = {
  id: ModelCapabilityId;
  /** Short noun used as the tooltip title. */
  label: string;
  /** Plain-language explanation shown when the badge is held down. */
  description: string;
  /** SF Symbol for the badge. */
  iosSymbol: ComposerSymbolName;
  /** Material Icons glyph for the badge, used by the React Native fallback. */
  fallbackIcon: ComposerFallbackIcon;
};

/** The capability vocabulary, so every model describes itself the same way. */
export const MODEL_CAPABILITIES: Record<ModelCapabilityId, ModelCapability> = {
  text: {
    id: 'text',
    label: 'Text',
    description: 'Reads and writes text in any language.',
    iosSymbol: 'text.alignleft',
    fallbackIcon: 'notes',
  },
  image: {
    id: 'image',
    label: 'Images',
    description: 'Understands photos, screenshots and scanned pages.',
    iosSymbol: 'photo',
    fallbackIcon: 'image',
  },
  documents: {
    id: 'documents',
    label: 'Files',
    description: 'Opens PDFs, spreadsheets and long documents.',
    iosSymbol: 'doc.text',
    fallbackIcon: 'description',
  },
  code: {
    id: 'code',
    label: 'Code',
    description: 'Reads, writes and reviews source files.',
    iosSymbol: 'chevron.left.forwardslash.chevron.right',
    fallbackIcon: 'code',
  },
  web: {
    id: 'web',
    label: 'Web',
    description: 'Looks things up and cites sources from the open web.',
    iosSymbol: 'globe',
    fallbackIcon: 'public',
  },
  reasoning: {
    id: 'reasoning',
    label: 'Reasoning',
    description: 'Thinks step by step before it answers.',
    iosSymbol: 'brain.head.profile',
    fallbackIcon: 'psychology',
  },
  audio: {
    id: 'audio',
    label: 'Audio',
    description: 'Listens to voice notes and audio clips.',
    iosSymbol: 'waveform',
    fallbackIcon: 'graphic-eq',
  },
  video: {
    id: 'video',
    label: 'Video',
    description: 'Watches screen recordings and video clips.',
    iosSymbol: 'video',
    fallbackIcon: 'videocam',
  },
};

/** How much deliberation a model can spend on a reply, from quickest to deepest. */
export const THINKING_LEVELS = ['low', 'medium', 'high', 'xhigh', 'max'] as const;

export type ThinkingLevel = (typeof THINKING_LEVELS)[number];

export const THINKING_LEVEL_LABELS: Record<ThinkingLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  xhigh: 'X-High',
  max: 'Max',
};

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
  /** Media and skills the model handles, shown as badges on the name line. */
  capabilities: readonly ModelCapabilityId[];
  /**
   * Thinking levels this model can be dialled through. Empty means the model
   * has no reasoning control, and the sheet hides its level picker.
   */
  thinkingLevels: readonly ThinkingLevel[];
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
    capabilities: ['text', 'image', 'web'],
    thinkingLevels: THINKING_LEVELS,
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
    capabilities: ['text'],
    thinkingLevels: THINKING_LEVELS,
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
    capabilities: ['text', 'reasoning'],
    thinkingLevels: THINKING_LEVELS,
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
    capabilities: ['text', 'image', 'documents'],
    thinkingLevels: [],
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
    capabilities: ['text', 'code', 'documents'],
    thinkingLevels: THINKING_LEVELS,
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
    capabilities: ['text', 'web', 'documents'],
    thinkingLevels: THINKING_LEVELS,
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
    capabilities: ['text'],
    thinkingLevels: [],
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
    capabilities: ['text', 'documents'],
    thinkingLevels: THINKING_LEVELS,
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
    capabilities: ['text', 'code'],
    thinkingLevels: [],
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

/**
 * The level a model starts on. Medium is the balanced default when a model
 * offers it; otherwise pick the middle of its range so the control never opens
 * pinned to an extreme.
 */
export function defaultThinkingLevel(model: HomeModel): ThinkingLevel | null {
  if (model.thinkingLevels.length === 0) return null;
  if (model.thinkingLevels.includes('medium')) return 'medium';
  return model.thinkingLevels[Math.floor((model.thinkingLevels.length - 1) / 2)];
}

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
