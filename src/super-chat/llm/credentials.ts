/**
 * Provider-key resolution. This module stays free of React, Expo and React
 * Native imports so plain Node can load it (see credentials.test.mjs).
 */

export type KeyStorage = {
  read(): Promise<string | null>;
  write(value: string): Promise<void>;
  remove(): Promise<void>;
};

export type KeySource = 'override' | 'default' | 'missing';

export type ResolvedKey = { key: string | null; source: KeySource };

const MASK_PREFIX = '•••• ';

/**
 * Trims whitespace and strips one pair of surrounding double quotes, which is
 * what a key copied out of a shell profile often carries. Single quotes are
 * left alone, and the key's shape is never validated.
 */
export function normalizeKey(raw: string | null | undefined): string | null {
  if (raw == null) {
    return null;
  }

  let value = raw.trim();
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1).trim();
  }

  return value.length > 0 ? value : null;
}

/**
 * Renders a key for display: the last four characters stay visible so the
 * settings row can tell two keys apart.
 */
export function maskKey(key: string | null): string {
  if (key == null) {
    return 'Not set';
  }

  const value = key.trim();
  if (value.length === 0) {
    return 'Not set';
  }

  return `${MASK_PREFIX}${value.slice(-4)}`;
}

/**
 * A key saved from Settings beats the key baked into the build. A keychain
 * read that fails is treated as "no override" rather than an error, so a
 * locked device still falls back to the bundled key.
 */
export async function resolveKey(
  storage: KeyStorage,
  bundled: string | null | undefined,
): Promise<ResolvedKey> {
  let stored: string | null = null;
  try {
    stored = await storage.read();
  } catch {
    stored = null;
  }

  const override = normalizeKey(stored);
  if (override != null) {
    return { key: override, source: 'override' };
  }

  const fallback = normalizeKey(bundled);
  return fallback != null
    ? { key: fallback, source: 'default' }
    : { key: null, source: 'missing' };
}
