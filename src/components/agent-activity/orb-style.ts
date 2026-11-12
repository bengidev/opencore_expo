import type { ThinkingOrbState } from 'panelui-native/components/thinking-orb';

import type { AgentActivityContentType } from './types.ts';

/**
 * The six silhouettes `ThinkingOrb` can draw, in the order Settings lists them.
 * The order runs from "work happening" to "a shape forming", which is the order
 * the activities tend to appear in a run.
 */
export const THINKING_ORB_STYLES = [
  'working',
  'searching',
  'solving',
  'listening',
  'composing',
  'shaping',
] as const satisfies readonly ThinkingOrbState[];

export type ThinkingOrbStyle = (typeof THINKING_ORB_STYLES)[number];

/**
 * `auto` follows the run; a style name pins one silhouette for every run.
 * Auto is the default because a pinned orb would be wrong for five of the six
 * activities, and the whole point of the orb is that the shape is the message.
 */
export type ThinkingOrbPreference = 'auto' | ThinkingOrbStyle;

export const DEFAULT_THINKING_ORB_PREFERENCE: ThinkingOrbPreference = 'auto';

/** Keychain item name and web storage key share this string. */
export const THINKING_ORB_PREFERENCE_KEY = 'opencore.thinkingOrb.preference';

export const AUTO_THINKING_ORB_LABEL = 'Auto';

export const AUTO_THINKING_ORB_DETAIL = 'The orb follows the activity';

/** Short names and one-line silhouettes, copied from how each state is drawn. */
export const THINKING_ORB_COPY: Record<ThinkingOrbStyle, { label: string; detail: string }> = {
  working: { label: 'Working', detail: 'Orbits in flight' },
  searching: { label: 'Searching', detail: 'A scan across a globe' },
  solving: { label: 'Solving', detail: 'Bands that click back' },
  listening: { label: 'Listening', detail: 'A wave through the rings' },
  composing: { label: 'Composing', detail: 'A line being written' },
  shaping: { label: 'Shaping', detail: 'Circle, triangle, square' },
};

/** What `auto` picks for each kind of activity the header can report. */
const AUTO_BY_CONTENT: Record<AgentActivityContentType, ThinkingOrbStyle> = {
  search: 'searching',
  tool: 'working',
  text: 'composing',
  step: 'solving',
  trace: 'solving',
  mixed: 'working',
};

export function isThinkingOrbStyle(value: unknown): value is ThinkingOrbStyle {
  return (
    typeof value === 'string' && (THINKING_ORB_STYLES as readonly string[]).includes(value)
  );
}

export function isThinkingOrbPreference(value: unknown): value is ThinkingOrbPreference {
  return value === 'auto' || isThinkingOrbStyle(value);
}

/** The orb to draw for a run: the pinned style, or whatever the run is doing. */
export function resolveThinkingOrbStyle(
  preference: ThinkingOrbPreference,
  contentType: AgentActivityContentType,
): ThinkingOrbStyle {
  if (preference !== 'auto') return preference;
  return AUTO_BY_CONTENT[contentType] ?? 'working';
}

/** Title for the Settings row: the pinned style's name, or `Auto`. */
export function thinkingOrbPreferenceLabel(preference: ThinkingOrbPreference): string {
  return preference === 'auto' ? AUTO_THINKING_ORB_LABEL : THINKING_ORB_COPY[preference].label;
}
