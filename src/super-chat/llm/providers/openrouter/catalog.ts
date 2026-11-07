import { normalizeThinkingLevels } from '../../thinking.ts';
import type { ModelCapabilityId, ProviderModel } from '../../types.ts';

const FREE_DEFAULT_MODEL_ID = 'openrouter/free';

const CAPABILITY_ORDER: readonly ModelCapabilityId[] = [
  'text',
  'image',
  'documents',
  'audio',
  'video',
  'code',
  'web',
  'reasoning',
];

const INPUT_MODALITY_CAPABILITY: Record<string, ModelCapabilityId> = {
  image: 'image',
  file: 'documents',
  audio: 'audio',
  video: 'video',
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asStringSet(value: unknown): Set<string> {
  const strings = new Set<string>();
  for (const entry of asArray(value)) {
    const text = asString(entry);
    if (text !== null) strings.add(text);
  }
  return strings;
}

function readCapabilities(model: Record<string, unknown>, id: string): ModelCapabilityId[] {
  const capabilities = new Set<ModelCapabilityId>(['text']);

  for (const modality of asArray(asRecord(model.architecture)?.input_modalities)) {
    const capability = INPUT_MODALITY_CAPABILITY[asString(modality) ?? ''];
    if (capability !== undefined) capabilities.add(capability);
  }

  const parameters = asStringSet(model.supported_parameters);
  if (parameters.has('tools')) capabilities.add('code');
  if (id.endsWith(':online')) capabilities.add('web');
  if (asRecord(model.reasoning) !== null || parameters.has('reasoning')) {
    capabilities.add('reasoning');
  }

  return CAPABILITY_ORDER.filter((capability) => capabilities.has(capability));
}

function isFree(pricing: Record<string, unknown> | null): boolean {
  return pricing?.prompt === '0' && pricing?.completion === '0';
}

function toProviderModel(value: unknown): ProviderModel | null {
  const model = asRecord(value);
  if (model === null) return null;

  const id = asString(model.id);
  if (id === null || id.length === 0) return null;
  if (!isFree(asRecord(model.pricing))) return null;

  const reasoning = asRecord(model.reasoning);
  const label = asString(model.name);
  const maxOutputTokens = asNumber(asRecord(model.top_provider)?.max_completion_tokens);

  return {
    id,
    label: label !== null && label.length > 0 ? label : id,
    description: asString(model.description) ?? '',
    contextLength: asNumber(model.context_length) ?? 0,
    ...(maxOutputTokens === null ? {} : { maxOutputTokens }),
    capabilities: readCapabilities(model, id),
    thinkingLevels: normalizeThinkingLevels(reasoning?.supported_efforts),
  };
}

export function toFreeProviderModels(payload: unknown): ProviderModel[] {
  const models: ProviderModel[] = [];
  for (const entry of asArray(asRecord(payload)?.data)) {
    const model = toProviderModel(entry);
    if (model !== null) models.push(model);
  }

  return models.sort((a, b) => {
    const aDefault = a.id === FREE_DEFAULT_MODEL_ID;
    const bDefault = b.id === FREE_DEFAULT_MODEL_ID;
    if (aDefault !== bDefault) return aDefault ? -1 : 1;
    return a.label.localeCompare(b.label);
  });
}

export function openRouterFallbackModels(): ProviderModel[] {
  return [
    {
      id: FREE_DEFAULT_MODEL_ID,
      label: 'OpenRouter Free',
      description: 'Free models, routed automatically.',
      contextLength: 200_000,
      capabilities: ['text', 'image', 'reasoning'],
      thinkingLevels: [],
    },
  ];
}
