import type { AgentActivityContentType, AgentActivityItem } from './types.ts';

/** Seconds read best short; a clean minute drops the `0s` tail so the eye stops at `2m`. */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  if (total < 60) return `${total}s`;

  const minutes = Math.floor(total / 60);
  const remainder = total % 60;

  return remainder === 0 ? `${minutes}m` : `${minutes}m ${remainder}s`;
}

/**
 * A caller that knows what it renders (super-chat always logs text) wins;
 * otherwise the run speaks for itself, and a mixed log has no single verb.
 */
export function contentTypeOf(
  items: AgentActivityItem[],
  fallback?: AgentActivityContentType,
): AgentActivityContentType {
  if (fallback) return fallback;

  const types = new Set(items.map((item) => item.type));
  const only = items[0]?.type;

  return types.size === 1 && only ? only : 'mixed';
}

const ACTIVE_LABELS: Record<AgentActivityContentType, string> = {
  search: 'Searching the web…',
  tool: 'Running tools…',
  trace: 'Working through the run…',
  mixed: 'Working through it…',
  step: 'Thinking…',
  text: 'Thinking…',
};

export function activeLabelFor(type: AgentActivityContentType): string {
  return ACTIVE_LABELS[type];
}

/**
 * Defaults for callers outside the chat, which are sentence-case and spoken
 * for the run as a whole; super-chat replaces both with its mono uppercase copy.
 */
export function summaryFor(
  items: AgentActivityItem[],
  type: AgentActivityContentType,
  duration: number,
): string {
  switch (type) {
    case 'search':
      return 'Searched the web';
    case 'tool':
      return `Ran ${items.length} tool${items.length === 1 ? '' : 's'}`;
    case 'trace': {
      let calls = 0;
      let messages = 0;

      for (const item of items) {
        if (item.type !== 'trace') continue;
        if (item.kind === 'message') messages += 1;
        // Thinking is the model working toward a call, not a call itself.
        else if (item.kind !== 'thinking') calls += 1;
      }

      return `${calls} tool calls, ${messages} message${messages === 1 ? '' : 's'}`;
    }
    case 'mixed':
      return `Completed ${items.length} step${items.length === 1 ? '' : 's'}`;
    default:
      return `Thought for ${formatDuration(duration)}`;
  }
}
