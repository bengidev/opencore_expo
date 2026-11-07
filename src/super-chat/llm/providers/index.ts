import type { ChatProvider, ProviderId } from '../types.ts';
import { openRouterProvider } from './openrouter/index.ts';

export const DEFAULT_PROVIDER_ID: ProviderId = 'openrouter';

export const providers: Record<ProviderId, ChatProvider> = {
  openrouter: openRouterProvider,
};

/**
 * Resolves a provider id, falling back to the default provider for ids this
 * build does not know (for example one persisted by a newer version).
 */
export function getProvider(id: ProviderId): ChatProvider {
  return providers[id] ?? providers[DEFAULT_PROVIDER_ID];
}
