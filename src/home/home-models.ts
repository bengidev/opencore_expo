import type { ComposerFallbackIcon, ComposerSymbolName } from '@/home/symbols';

export type HomeModel = {
  id: string;
  name: string;
  /** SF Symbol shown next to the model name. */
  iosSymbol: ComposerSymbolName;
  /** Material Symbols icon name, without the `.xml` extension. */
  androidIcon: HomeModelAndroidIcon;
  /** Material Icons glyph name, used by the React Native fallback. */
  fallbackIcon: ComposerFallbackIcon;
};

/** Material Symbols used by the Android model menu. */
export type HomeModelAndroidIcon = 'auto_awesome_mosaic' | 'bolt' | 'psychology';

/** Models offered by the composer, in the order they are presented. */
export const HOME_MODELS: readonly HomeModel[] = [
  {
    id: 'opencore',
    name: 'OpenCore',
    iosSymbol: 'sparkles',
    androidIcon: 'auto_awesome_mosaic',
    fallbackIcon: 'auto-awesome',
  },
  {
    id: 'fast',
    name: 'Fast',
    iosSymbol: 'bolt.fill',
    androidIcon: 'bolt',
    fallbackIcon: 'bolt',
  },
  {
    id: 'deep',
    name: 'Deep',
    iosSymbol: 'brain.head.profile',
    androidIcon: 'psychology',
    fallbackIcon: 'psychology',
  },
];

export const DEFAULT_HOME_MODEL_ID = HOME_MODELS[0].id;
