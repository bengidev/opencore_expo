import type { ComposerFallbackIcon, ComposerSymbolName } from '@/home/symbols';

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
export type HomeModelAndroidIcon = 'auto_awesome_mosaic' | 'bolt' | 'psychology';

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
