import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  getModelSelection,
  resolveSelectedModel,
  selectModelId,
  selectThinkingLevel,
} from './model-selection-store.ts';
import { DEFAULT_PROVIDER_ID, getProvider } from './providers/index.ts';
import { clampThinkingLevel, defaultThinkingLevelFor } from './thinking.ts';
import type {
  ChatProvider,
  ModelListContext,
  ProviderId,
  ProviderModel,
} from './types.ts';
import { useModelSelection } from './use-model-selection.ts';

/** How long a fetched catalogue stays fresh before the next mount refetches it. */
const MODEL_CACHE_MS = 10 * 60 * 1000;

type ModelCatalogStatus = 'loading' | 'ready' | 'fallback';

type CachedCatalog = { at: number; models: ProviderModel[] };

const cache = new Map<ProviderId, CachedCatalog>();

type CatalogState = {
  models: ProviderModel[];
  status: ModelCatalogStatus;
  error: string | null;
};

/**
 * True while a fetched list is still the provider's synthetic fallback row.
 * Providers report a failed catalogue by returning that row instead of
 * rejecting, so identity by ids is the only way to tell it apart from a live
 * list that happens to have the same size.
 */
export function isFallbackList(
  models: readonly ProviderModel[],
  fallback: readonly ProviderModel[],
): boolean {
  if (models.length !== fallback.length) return false;
  return models.every((model, index) => model.id === fallback[index]?.id);
}

function isFresh(entry: CachedCatalog): boolean {
  return Date.now() - entry.at < MODEL_CACHE_MS;
}

/** Pure: an expired entry is a miss. Pruning happens on write, never in render. */
function readCache(providerId: ProviderId): ProviderModel[] | null {
  const entry = cache.get(providerId);
  return entry !== undefined && isFresh(entry) ? entry.models : null;
}

function pruneExpired(): void {
  for (const [providerId, entry] of cache) {
    if (!isFresh(entry)) cache.delete(providerId);
  }
}

function seedState(provider: ChatProvider): CatalogState {
  const cached = readCache(provider.id);
  if (cached !== null) {
    return { models: cached, status: 'ready', error: null };
  }
  return { models: [...provider.fallbackModels], status: 'loading', error: null };
}

/**
 * The model row to show while a provider has no callable model at all. The
 * shipped providers always have a fallback, so this only guards the chip
 * against rendering `undefined`.
 */
function placeholderModel(provider: ChatProvider): ProviderModel {
  return {
    id: provider.defaultModelId,
    label: provider.label,
    description: '',
    contextLength: 0,
    capabilities: ['text'],
    thinkingLevels: [],
  };
}

/**
 * The live free catalogue, shared by every composer. Models arrive from the
 * provider's public list endpoint, with its fallback row shown until then (and
 * kept when the request fails, so the composer is never empty). The provider is
 * expected to be stable for the life of the screen; both composers use the
 * default one.
 */
export function useModelCatalog(provider: ChatProvider = getProvider(DEFAULT_PROVIDER_ID)) {
  const [catalog, setCatalog] = useState<CatalogState>(() => seedState(provider));
  const [reloadToken, setReloadToken] = useState(0);
  const selection = useModelSelection();

  useEffect(() => {
    let cancelled = false;
    // Prune here rather than in `readCache`, which also runs during render.
    pruneExpired();
    // A fresh cache entry is already in state; only fetch when there is none.
    if (readCache(provider.id) !== null) return;

    const context: ModelListContext = { apiKey: null, fetch };

    void provider
      .listModels(context)
      .then((live) => {
        const usable = live.length > 0 && !isFallbackList(live, provider.fallbackModels);
        // Never cache a stand-in (the provider's fallback row, or an empty
        // answer): it would hide the catalogue for ten minutes. Write before
        // the cancellation check so leaving Home keeps the result.
        if (usable) {
          pruneExpired();
          cache.set(provider.id, { at: Date.now(), models: live });
        }
        if (cancelled) return;
        setCatalog(
          usable
            ? { models: live, status: 'ready', error: null }
            : { models: [...provider.fallbackModels], status: 'fallback', error: null },
        );
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setCatalog({
          models: [...provider.fallbackModels],
          status: 'fallback',
          error: reason instanceof Error ? reason.message : String(reason),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [provider, reloadToken]);

  // A model stored by an earlier session may be gone from today's catalogue.
  // Only a live catalogue may coerce it: the fallback row must not overwrite a
  // selection the user made from the real list.
  useEffect(() => {
    if (catalog.status !== 'ready') return;
    const selected = resolveSelectedModel(catalog.models, selection.modelId);
    if (selected !== null && selected.id !== selection.modelId) {
      selectModelId(selected.id);
    }
  }, [catalog.models, catalog.status, selection.modelId]);

  const placeholder = useMemo(() => placeholderModel(provider), [provider]);
  const selectedModel = resolveSelectedModel(catalog.models, selection.modelId) ?? placeholder;

  const thinking = clampThinkingLevel(
    selectedModel.thinkingLevels,
    selection.thinkingByModel[selectedModel.id],
  );

  const selectModel = useCallback((model: ProviderModel) => {
    const { thinkingByModel } = getModelSelection();
    if (thinkingByModel[model.id] === undefined) {
      const level = defaultThinkingLevelFor(model.thinkingLevels);
      if (level !== null) selectThinkingLevel(model.id, level);
    }
    selectModelId(model.id);
  }, []);

  const reload = useCallback(() => {
    cache.delete(provider.id);
    setCatalog(seedState(provider));
    setReloadToken((token) => token + 1);
  }, [provider]);

  return useMemo(
    () => ({
      provider,
      models: catalog.models,
      status: catalog.status,
      error: catalog.error,
      selection,
      selectedModel,
      thinking,
      selectModel,
      reload,
    }),
    [
      catalog,
      provider,
      reload,
      selectModel,
      selectedModel,
      selection,
      thinking,
    ],
  );
}
