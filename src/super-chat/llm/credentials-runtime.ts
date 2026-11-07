/**
 * Runtime wiring for provider keys: SecureStore on device, Constants for the
 * build-time default, and a tiny external store for the Settings row.
 *
 * This module is not covered by the Node tests in credentials.test.mjs because
 * it needs React Native and Expo modules at import time.
 */

import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import {
  maskKey,
  resolveKey,
  type KeySource,
  type KeyStorage,
} from './credentials.ts';

export const OPENROUTER_KEY_NAME = 'opencore.openrouter.apiKey';

export type KeyStatusView = {
  key: string | null;
  masked: string;
  source: KeySource;
  label: 'Custom' | 'Default' | 'Missing';
};

const LABELS: Record<KeySource, KeyStatusView['label']> = {
  override: 'Custom',
  default: 'Default',
  missing: 'Missing',
};

/**
 * The web build has no keychain. Keeping the override in a module-level string
 * only serves the development server; it is gone on reload and is never a
 * place to keep a real key.
 */
let webValue: string | null = null;

export const secureKeyStorage: KeyStorage = {
  async read() {
    if (Platform.OS === 'web') {
      return webValue;
    }

    return SecureStore.getItemAsync(OPENROUTER_KEY_NAME, {
      keychainService: OPENROUTER_KEY_NAME,
    });
  },

  async write(value: string) {
    if (Platform.OS === 'web') {
      webValue = value;
      return;
    }

    await SecureStore.setItemAsync(OPENROUTER_KEY_NAME, value, {
      keychainService: OPENROUTER_KEY_NAME,
    });
  },

  async remove() {
    if (Platform.OS === 'web') {
      webValue = null;
      return;
    }

    await SecureStore.deleteItemAsync(OPENROUTER_KEY_NAME, {
      keychainService: OPENROUTER_KEY_NAME,
    });
  },
};

function bundledKey(): string | null {
  const value: unknown = Constants.expoConfig?.extra?.openRouterApiKey;
  return typeof value === 'string' ? value : null;
}

function viewOf(key: string | null, source: KeySource): KeyStatusView {
  return { key, masked: maskKey(key), source, label: LABELS[source] };
}

let currentStatus: KeyStatusView | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): KeyStatusView | null {
  return currentStatus;
}

/** Reads the keychain and the bundled default without touching subscribers. */
export async function readKeyStatus(): Promise<KeyStatusView> {
  const resolved = await resolveKey(secureKeyStorage, bundledKey());
  return viewOf(resolved.key, resolved.source);
}

/** Re-reads the key and pushes the result to every mounted consumer. */
export async function refreshKeyStatus(): Promise<KeyStatusView> {
  const status = await readKeyStatus();
  currentStatus = status;
  emit();
  return status;
}

export async function saveOverrideKey(value: string): Promise<void> {
  await secureKeyStorage.write(value);
  await refreshKeyStatus();
}

export async function clearOverrideKey(): Promise<void> {
  await secureKeyStorage.remove();
  await refreshKeyStatus();
}

/**
 * The status view for the Settings row. It starts as `null` until a screen
 * calls `refreshKeyStatus`, which keeps the first render cheap and skips a
 * keychain read on every mount of an unrelated screen.
 */
export function useKeyStatus(): KeyStatusView | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
