import type { ComposerFallbackIcon, ComposerSymbolName } from '@/super-chat/composer/symbols';
import type { ProviderModel } from '@/super-chat/llm/types';

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
  /** Short noun used in the row's spoken capability summary. */
  label: string;
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
    iosSymbol: 'text.alignleft',
    fallbackIcon: 'notes',
  },
  image: {
    id: 'image',
    label: 'Images',
    iosSymbol: 'photo',
    fallbackIcon: 'image',
  },
  documents: {
    id: 'documents',
    label: 'Files',
    iosSymbol: 'doc.text',
    fallbackIcon: 'description',
  },
  code: {
    id: 'code',
    label: 'Code',
    iosSymbol: 'chevron.left.forwardslash.chevron.right',
    fallbackIcon: 'code',
  },
  web: {
    id: 'web',
    label: 'Web',
    iosSymbol: 'globe',
    fallbackIcon: 'public',
  },
  reasoning: {
    id: 'reasoning',
    label: 'Reasoning',
    iosSymbol: 'brain.head.profile',
    fallbackIcon: 'psychology',
  },
  audio: {
    id: 'audio',
    label: 'Audio',
    iosSymbol: 'waveform',
    fallbackIcon: 'graphic-eq',
  },
  video: {
    id: 'video',
    label: 'Video',
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
  /** One-line summary announced with the row by assistive technology. */
  description: string;
  /** SF Symbol shown next to the model name. */
  iosSymbol: ComposerSymbolName;
  /** Material Symbols icon name, without the `.xml` extension. */
  androidIcon: HomeModelAndroidIcon;
  /** Material Icons glyph name, used by the React Native fallback. */
  fallbackIcon: ComposerFallbackIcon;
  /** Media and skills the model handles, shown as badges under the name. */
  capabilities: readonly ModelCapabilityId[];
  /**
   * Thinking levels this model can be dialled through. Empty means the model
   * has no reasoning control, and the sheet hides its level picker.
   */
  thinkingLevels: readonly ThinkingLevel[];
  /** Extra terms the search field should match. */
  keywords: readonly string[];
};

/** Material Symbols used by the native Android trigger and sheet. */
export type HomeModelAndroidIcon =
  | 'image'
  | 'videocam'
  | 'graphic_eq'
  | 'description'
  | 'code'
  | 'globe'
  | 'psychology'
  | 'auto_awesome_mosaic'
  | 'chat';

type ModelVisual = {
  iosSymbol: ComposerSymbolName;
  androidIcon: HomeModelAndroidIcon;
};

/** The capability that gives a model its icon, most specific first. */
const MODEL_VISUALS: readonly { capability: ModelCapabilityId; visual: ModelVisual }[] = [
  { capability: 'reasoning', visual: { iosSymbol: 'brain', androidIcon: 'psychology' } },
  { capability: 'image', visual: { iosSymbol: 'photo', androidIcon: 'image' } },
  {
    capability: 'documents',
    visual: { iosSymbol: 'doc.text', androidIcon: 'description' },
  },
  {
    capability: 'code',
    visual: {
      iosSymbol: 'chevron.left.forwardslash.chevron.right',
      androidIcon: 'code',
    },
  },
  { capability: 'web', visual: { iosSymbol: 'globe', androidIcon: 'globe' } },
  { capability: 'audio', visual: { iosSymbol: 'waveform', androidIcon: 'graphic_eq' } },
  { capability: 'video', visual: { iosSymbol: 'video', androidIcon: 'videocam' } },
];

const DEFAULT_MODEL_VISUAL: ModelVisual = {
  iosSymbol: 'sparkles',
  androidIcon: 'auto_awesome_mosaic',
};

function visualFor(model: ProviderModel): ModelVisual {
  return (
    MODEL_VISUALS.find(({ capability }) => model.capabilities.includes(capability))?.visual ??
    DEFAULT_MODEL_VISUAL
  );
}

/** Search terms: the spoken name, plus the raw id so an exact slug still matches. */
function keywordsFor(model: ProviderModel): string[] {
  return [model.label.toLowerCase(), model.id].filter((keyword) => keyword.length > 0);
}

/** Presents a provider model in the vocabulary the model sheet already speaks. */
export function toHomeModel(model: ProviderModel): HomeModel {
  const visual = visualFor(model);
  return {
    id: model.id,
    name: model.label,
    description: model.description,
    iosSymbol: visual.iosSymbol,
    androidIcon: visual.androidIcon,
    fallbackIcon: 'auto-awesome',
    capabilities: model.capabilities,
    thinkingLevels: model.thinkingLevels,
    keywords: keywordsFor(model),
  };
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
