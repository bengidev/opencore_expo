import type { ComposerFallbackIcon, ComposerSymbolName } from '@/home/symbols';

export type HomeModel = {
  id: string;
  name: string;
  subtitle: string;
  /** SF Symbol shown next to the model name. */
  iosSymbol: ComposerSymbolName;
  /** Material Symbols icon name, without the `.xml` extension. */
  androidIcon: HomeModelAndroidIcon;
  /** Material Icons glyph name, used by the React Native fallback. */
  fallbackIcon: ComposerFallbackIcon;
  /** Extra terms the composer search should match. */
  keywords: readonly string[];
};

/** Material Symbols used by the Android model menu. */
export type HomeModelAndroidIcon = 'auto_awesome_mosaic' | 'bolt' | 'psychology';

/** Models offered by the composer, in the order they are presented. */
export const HOME_MODELS: readonly HomeModel[] = [
  {
    id: 'opencore',
    name: 'OpenCore',
    subtitle: 'Balanced',
    iosSymbol: 'sparkles',
    androidIcon: 'auto_awesome_mosaic',
    fallbackIcon: 'auto-awesome',
    keywords: ['default', 'balanced', 'model'],
  },
  {
    id: 'fast',
    name: 'Fast',
    subtitle: 'Quick answers',
    iosSymbol: 'bolt.fill',
    androidIcon: 'bolt',
    fallbackIcon: 'bolt',
    keywords: ['quick', 'speed', 'model'],
  },
  {
    id: 'deep',
    name: 'Deep',
    subtitle: 'Deep reasoning',
    iosSymbol: 'brain.head.profile',
    androidIcon: 'psychology',
    fallbackIcon: 'psychology',
    keywords: ['reasoning', 'thorough', 'model'],
  },
];

export const DEFAULT_HOME_MODEL_ID = HOME_MODELS[0].id;
