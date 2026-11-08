import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

/** The sheet's automatic retry on open stays quiet for this long after a try. */
const RETRY_GUARD_MS = 10 * 1000;

export type ModelCatalogStatus = 'loading' | 'ready' | 'fallback';

type CachedCatalog = { at: number; models: ProviderModel[] };

const cache = new Map<ProviderId, CachedCatalog>();

type CatalogState = {
  models: ProviderModel[];
  status: ModelCatalogStatus;
  error: string | null;
};

export type CatalogLoad =
  | { kind: 'ready'; models: ProviderModel[]; error: null }
  | { kind: 'fallback'; models: ProviderModel[]; error: string | null };

/**
 * Runs one catalogue request to a settled outcome. Only a rejection is a
 * failure: a provider that resolves a list - even one whose ids match its
 * fallback row - has delivered a live answer, and is reported as 'ready'.
 */
export async function loadModelCatalog(
  provider: ChatProvider,
  context: ModelListContext,
): Promise<CatalogLoad> {
  try {
    const live = await provider.listModels(context);
    return { kind: 'ready', models: live, error: null };
  } catch (reason: unknown) {
    return {
      kind: 'fallback',
      models: [...provider.fallbackModels],
      error: reason instanceof Error ? reason.message : String(reason),
    };
  }
}

/**
 * True while a fetched list is still the provider's synthetic fallback row.
 * Used only to keep a stand-in out of the cache; it never decides the status.
 */
export function isFallbackList(
  models: readonly ProviderModel[],
  fallback: readonly ProviderModel[],
): boolean {
  if (models.length !== fallback.length) return false;
  return models.every((model, index) => model.id === fallback[index]?.id);
}

/** The saved key, read lazily so this module stays importable in Node. */
async function readApiKey(): Promise<string | null> {
  try {
    const { readKeyStatus } = await import('./credentials-runtime.ts');
    const status = await readKeyStatus();
    return status.key;
  } catch {
    return null;
  }
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
  // Set by the request's catch and cleared by its success; `status` reads this
  // flag, never the payload, so a genuinely small live list stays 'ready'.
  const failedRef = useRef(false);
  const lastAttemptAtRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    // Prune here rather than in `readCache`, which also runs during render.
    pruneExpired();
    // A fresh cache entry is already in state; only fetch when there is none.
    if (readCache(provider.id) !== null) return;

    void (async () => {
      lastAttemptAtRef.current = Date.now();
      // Runtime-only import: the keychain module pulls React Native and Expo,
      // which the Node tests cannot load.
      const apiKey = await readApiKey();
      const loaded = await loadModelCatalog(provider, { apiKey, fetch });
      failedRef.current = loaded.kind === 'fallback';
      // Never cache a stand-in (the provider's fallback row, or an empty
      // answer): it would hide the catalogue for ten minutes. Write before
      // the cancellation check so leaving Home keeps the result.
      if (
        loaded.kind === 'ready' &&
        loaded.models.length > 0 &&
        !isFallbackList(loaded.models, provider.fallbackModels)
      ) {
        pruneExpired();
        cache.set(provider.id, { at: Date.now(), models: loaded.models });
      }
      if (cancelled) return;
      setCatalog({
        models: loaded.models,
        status: failedRef.current ? 'fallback' : 'ready',
        error: loaded.error,
      });
    })();

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

  /**
   * The sheet's automatic retry when it opens. Reopening in the same failure
   * window must not refetch, or the caption and skeleton flicker on every tap;
   * the explicit "Try again" still calls `reload`.
   */
  const retryOnOpen = useCallback(() => {
    if (Date.now() - lastAttemptAtRef.current < RETRY_GUARD_MS) return;
    reload();
  }, [reload]);

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
      retryOnOpen,
    }),
    [
      catalog,
      provider,
      reload,
      retryOnOpen,
      selectModel,
      selectedModel,
      selection,
      thinking,
    ],
  );
}
