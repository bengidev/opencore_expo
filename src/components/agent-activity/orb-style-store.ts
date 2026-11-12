import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import {
  DEFAULT_THINKING_ORB_PREFERENCE,
  THINKING_ORB_PREFERENCE_KEY,
  isThinkingOrbPreference,
  type ThinkingOrbPreference,
} from './orb-style.ts';

/**
 * The orb the user picked, remembered across launches.
 *
 * The value is read once, when the first component that cares mounts, and
 * written on every change. A failed read or write leaves the in-memory choice
 * in place: a preference is not worth blocking the chat header on.
 */

const listeners = new Set<() => void>();

let preference: ThinkingOrbPreference = DEFAULT_THINKING_ORB_PREFERENCE;
let hydration: Promise<void> | null = null;
/** A choice made before the read lands must win over the stored one. */
let changedThisSession = false;

type WebStorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

/** The web build has no keychain; localStorage still remembers the choice. */
function webStorage(): WebStorageLike | null {
  try {
    return (globalThis as unknown as { localStorage?: WebStorageLike }).localStorage ?? null;
  } catch {
    return null;
  }
}

function emit(): void {
  // Snapshot the listeners so one that unsubscribes mid-emit cannot change the
  // set this pass reaches, and one that throws is reported on its own turn.
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

async function readStored(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return webStorage()?.getItem(THINKING_ORB_PREFERENCE_KEY) ?? null;
  }

  try {
    return await SecureStore.getItemAsync(THINKING_ORB_PREFERENCE_KEY);
  } catch {
    return null;
  }
}

async function writeStored(value: ThinkingOrbPreference): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      webStorage()?.setItem(THINKING_ORB_PREFERENCE_KEY, value);
    } catch {
      // Private mode and full quotas both land here; the session still works.
    }
    return;
  }

  try {
    await SecureStore.setItemAsync(THINKING_ORB_PREFERENCE_KEY, value);
  } catch {
    // Same trade: the choice applies until the app is closed.
  }
}

function hydrate(): Promise<void> {
  hydration ??= (async () => {
    const stored = await readStored();
    if (changedThisSession || !isThinkingOrbPreference(stored) || stored === preference) return;

    preference = stored;
    emit();
  })();

  return hydration;
}

/** The current choice. A primitive, so it is a stable store snapshot. */
export function getThinkingOrbPreference(): ThinkingOrbPreference {
  return preference;
}

export function subscribeThinkingOrbPreference(listener: () => void): () => void {
  listeners.add(listener);
  // The header mounts before Settings does, so reading on subscribe means the
  // first orb anyone sees is already the one they picked.
  void hydrate();

  return () => {
    listeners.delete(listener);
  };
}

export function setThinkingOrbPreference(next: ThinkingOrbPreference): void {
  if (!isThinkingOrbPreference(next) || next === preference) return;

  changedThisSession = true;
  preference = next;
  emit();
  void writeStored(next);
}

export function useThinkingOrbPreference(): ThinkingOrbPreference {
  return useSyncExternalStore(
    subscribeThinkingOrbPreference,
    getThinkingOrbPreference,
    getThinkingOrbPreference,
  );
}
