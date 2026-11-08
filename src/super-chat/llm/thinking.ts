import type { ThinkingLevel } from './types.ts';

export const THINKING_LEVELS = ['low', 'medium', 'high', 'xhigh', 'max'] as const;

export function normalizeThinkingLevels(raw: unknown): ThinkingLevel[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set<string>(THINKING_LEVELS);
  const seen = new Set<string>();
  const levels = raw.map((level) => (level === 'minimal' ? 'low' : level));
  return THINKING_LEVELS.filter((level) => {
    if (!levels.includes(level) || !known.has(level) || seen.has(level)) return false;
    seen.add(level);
    return true;
  });
}

export function defaultThinkingLevelFor(levels: readonly ThinkingLevel[]): ThinkingLevel | null {
  if (levels.length === 0) return null;
  if (levels.includes('medium')) return 'medium';
  return levels[Math.floor((levels.length - 1) / 2)] ?? null;
}

/**
 * The stored level when the model still offers it, else the model's default.
 * Guards against a level left behind by a catalogue that has since narrowed a
 * model's reasoning options.
 */
export function clampThinkingLevel(
  levels: readonly ThinkingLevel[],
  stored: ThinkingLevel | undefined,
): ThinkingLevel | null {
  if (stored !== undefined && levels.includes(stored)) return stored;
  return defaultThinkingLevelFor(levels);
}
