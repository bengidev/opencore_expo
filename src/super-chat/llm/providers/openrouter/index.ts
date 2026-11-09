import type { ChatProvider } from '../../types.ts';
import { openRouterFallbackModels } from './catalog.ts';
import {
  checkOpenRouterKey,
  listOpenRouterModels,
  streamOpenRouterChat,
} from './client.ts';

export const openRouterProvider: ChatProvider = {
  id: 'openrouter',
  label: 'OpenRouter',
  requiresKey: true,
  defaultModelId: 'openrouter/free',
  fallbackModels: openRouterFallbackModels(),
  streamChat: streamOpenRouterChat,
  listModels: listOpenRouterModels,
  checkKey: checkOpenRouterKey,
};
