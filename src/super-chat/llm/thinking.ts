import type { ThinkingLevel } from './types.ts';

export const THINKING_LEVELS = ['low', 'medium', 'high', 'xhigh', 'max'] as const;

export function normalizeThinkingLevels(raw: unknown): ThinkingLevel[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set<string>(THINKING_LEVELS);
  const seen = new Set<string>();
  return THINKING_LEVELS.filter((level) => {
    if (!raw.includes(level) || !known.has(level) || seen.has(level)) return false;
    seen.add(level);
    return true;
  });
}

export function defaultThinkingLevelFor(levels: readonly ThinkingLevel[]): ThinkingLevel | null {
  if (levels.length === 0) return null;
  if (levels.includes('medium')) return 'medium';
  return levels[Math.floor((levels.length - 1) / 2)] ?? null;
}
