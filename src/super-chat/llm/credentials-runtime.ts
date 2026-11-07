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
  normalizeKey,
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

/**
 * `WHEN_UNLOCKED_THIS_DEVICE_ONLY` keeps the override out of encrypted device
 * backups: a restored keychain item the app cannot decrypt is worse than no
 * override at all, and the bundled default still covers a new device.
 */
const KEYCHAIN_OPTIONS = {
  keychainService: OPENROUTER_KEY_NAME,
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
} as const;

export const secureKeyStorage: KeyStorage = {
  async read() {
    if (Platform.OS === 'web') {
      return webValue;
    }

    return SecureStore.getItemAsync(OPENROUTER_KEY_NAME, KEYCHAIN_OPTIONS);
  },

  async write(value: string) {
    if (Platform.OS === 'web') {
      webValue = value;
      return;
    }

    await SecureStore.setItemAsync(OPENROUTER_KEY_NAME, value, KEYCHAIN_OPTIONS);
  },

  async remove() {
    if (Platform.OS === 'web') {
      webValue = null;
      return;
    }

    await SecureStore.deleteItemAsync(OPENROUTER_KEY_NAME, KEYCHAIN_OPTIONS);
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
let latestRequestId = 0;
let appliedRequestId = 0;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  // The first active subscriber starts one read; later subscribers reuse the
  // cached view. `saveOverrideKey` and `clearOverrideKey` refresh on their own.
  if (listeners.size === 1) {
    void refreshKeyStatus().catch(() => {});
  }

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

/**
 * Re-reads the key and pushes the result to every mounted consumer. Reads can
 * overlap, so a response is only applied when it is newer than the last one
 * already applied; an out-of-order read returns the applied view instead.
 */
export async function refreshKeyStatus(): Promise<KeyStatusView> {
  const requestId = ++latestRequestId;
  const status = await readKeyStatus();

  if (requestId < appliedRequestId) {
    return currentStatus ?? status;
  }

  appliedRequestId = requestId;
  currentStatus = status;
  emit();
  return status;
}

export async function saveOverrideKey(value: string): Promise<void> {
  await secureKeyStorage.write(normalizeKey(value) ?? '');
  await refreshKeyStatus();
}

export async function clearOverrideKey(): Promise<void> {
  await secureKeyStorage.remove();
  await refreshKeyStatus();
}

/**
 * The status view for the Settings row. It starts as `null`, and the first
 * subscriber triggers one `refreshKeyStatus` so the row fills in without the
 * screen having to run an effect of its own.
 */
export function useKeyStatus(): KeyStatusView | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
