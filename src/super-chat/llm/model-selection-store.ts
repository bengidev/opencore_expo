import { DEFAULT_PROVIDER_ID, getProvider } from './providers/index.ts';
import type { ProviderId, ProviderModel, ThinkingLevel } from './types.ts';

export type ModelSelection = {
  providerId: ProviderId;
  modelId: string;
  thinkingByModel: Record<string, ThinkingLevel>;
};

const listeners = new Set<() => void>();

const initialProvider = getProvider(DEFAULT_PROVIDER_ID);

let selection: ModelSelection = {
  providerId: initialProvider.id,
  modelId: initialProvider.defaultModelId,
  thinkingByModel: {},
};

/** The current selection. Same reference until something changes it. */
export function getModelSelection(): ModelSelection {
  return selection;
}

export function subscribeModelSelection(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit(): void {
  // Iterate a snapshot: a listener that unsubscribes (or subscribes) mid-emit
  // must not change which listeners this pass reaches, and a throwing listener
  // is reported on its own turn instead of starving the ones after it.
  for (const listener of [...listeners]) {
    try {
      listener();
    } catch (error) {
      queueMicrotask(() => {
        throw error;
      });
    }
  }
}

/** Trimmed model id, or `null` when the value is not a usable id. */
function normalizeModelId(modelId: string): string | null {
  if (typeof modelId !== 'string') return null;
  const trimmed = modelId.trim();
  return trimmed ? trimmed : null;
}

/**
 * Points the selection at a model. The default thinking level is seeded by the
 * caller that knows the model's levels, so this store stays catalogue-free.
 */
export function selectModelId(modelId: string): void {
  const nextId = normalizeModelId(modelId);
  if (!nextId || nextId === selection.modelId) return;
  selection = { ...selection, modelId: nextId };
  emit();
}

/** Remembers a thinking level per model, so switching models keeps each one's. */
export function selectThinkingLevel(modelId: string, level: ThinkingLevel): void {
  const nextId = normalizeModelId(modelId);
  if (!nextId || selection.thinkingByModel[nextId] === level) return;
  selection = {
    ...selection,
    thinkingByModel: { ...selection.thinkingByModel, [nextId]: level },
  };
  emit();
}

/** The matching catalogue row, else the first row, else `null`. Never mutates. */
export function resolveSelectedModel(
  models: readonly ProviderModel[],
  modelId: string,
): ProviderModel | null {
  return models.find((model) => model.id === modelId) ?? models[0] ?? null;
}
