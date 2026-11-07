import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  getModelSelection,
  resolveSelectedModel,
  selectModelId,
  selectThinkingLevel,
} from './model-selection-store';
import { DEFAULT_PROVIDER_ID, getProvider } from './providers/index';
import { defaultThinkingLevelFor } from './thinking';
import type {
  ChatProvider,
  ModelListContext,
  ProviderId,
  ProviderModel,
} from './types';
import { useModelSelection } from './use-model-selection';

/** How long a fetched catalogue stays fresh before the next mount refetches it. */
export const MODEL_CACHE_MS = 10 * 60 * 1000;

type ModelCatalogStatus = 'loading' | 'ready' | 'fallback';

type CachedCatalog = { at: number; models: ProviderModel[] };

const cache = new Map<ProviderId, CachedCatalog>();

type CatalogState = {
  models: ProviderModel[];
  status: ModelCatalogStatus;
  error: string | null;
};

function readCache(providerId: ProviderId): ProviderModel[] | null {
  const entry = cache.get(providerId);
  if (entry === undefined) return null;
  if (Date.now() - entry.at >= MODEL_CACHE_MS) {
    cache.delete(providerId);
    return null;
  }
  return entry.models;
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
    // A fresh cache entry is already in state; only fetch when there is none.
    if (readCache(provider.id) !== null) return;

    const context: ModelListContext = { apiKey: null, fetch };

    void provider
      .listModels(context)
      .then((live) => {
        if (cancelled) return;
        if (live.length === 0) {
          setCatalog({ models: [...provider.fallbackModels], status: 'fallback', error: null });
          return;
        }
        cache.set(provider.id, { at: Date.now(), models: live });
        setCatalog({ models: live, status: 'ready', error: null });
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
  // Coerce once the live list is in, never while the fallback row is standing in.
  useEffect(() => {
    if (catalog.status === 'loading') return;
    const selected = resolveSelectedModel(catalog.models, selection.modelId);
    if (selected !== null && selected.id !== selection.modelId) {
      selectModelId(selected.id);
    }
  }, [catalog.models, catalog.status, selection.modelId]);

  const placeholder = useMemo(() => placeholderModel(provider), [provider]);
  const selectedModel = resolveSelectedModel(catalog.models, selection.modelId) ?? placeholder;

  const thinking =
    selection.thinkingByModel[selectedModel.id] ??
    defaultThinkingLevelFor(selectedModel.thinkingLevels);

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
