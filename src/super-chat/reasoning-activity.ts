/**
 * Maps a message's reasoning trace onto the shape the activity rows render.
 * Kept free of React and React Native imports so the node test suite can
 * verify the mapping directly.
 */

import type { ChatMessage } from './chat-message.ts';

export type ReasoningActivity = {
  id: string;
  text: string;
  status: 'working' | 'complete';
  duration: number;
  activeLabel: string;
  summary: string;
};

/**
 * A trace that took under a second still happened, so the shortest duration we
 * report is one second — "THOUGHT FOR 0 SECONDS" reads like nothing occurred.
 */
export function formatThoughtDuration(seconds: number): string {
  const whole = Math.max(1, Math.round(seconds));
  const unit = whole === 1 ? 'SECOND' : 'SECONDS';
  return `THOUGHT FOR ${whole} ${unit}`;
}

export function reasoningActivity(message: ChatMessage): ReasoningActivity | null {
  if (message.role !== 'assistant') return null;
  // A reply that never reasoned has no row to fold; a recorded duration alone
  // still does, since the trace may have been cleared once it settled.
  if (message.reasoning === '' && message.reasoningDuration === undefined) return null;

  const duration = Math.max(1, Math.round(message.reasoningDuration ?? 1));

  return {
    id: `${message.id}-reasoning`,
    text: message.reasoning,
    status: message.reasoningStreaming ? 'working' : 'complete',
    duration,
    activeLabel: 'THINKING…',
    summary: formatThoughtDuration(duration),
  };
}
