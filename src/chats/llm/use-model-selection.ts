import { useSyncExternalStore } from 'react';

import {
  getModelSelection,
  subscribeModelSelection,
  type ModelSelection,
} from './model-selection-store.ts';

/**
 * The model and thinking level shared by Home, the chat screen, and the
 * composer's model picker.
 */
export function useModelSelection(): ModelSelection {
  return useSyncExternalStore(
    subscribeModelSelection,
    getModelSelection,
    getModelSelection,
  );
}
