export type OnboardingSpeechState = {
  index: number;
  revision: number;
  anchorFraction: number;
};

type SpeechRotationReason = 'tap' | 'timer';
type SpeechLines = readonly [string, string, ...string[]];

const ANCHORS = [0.42, 0.5, 0.58] as const;

export function advanceSpeech({
  state,
  reason,
  lines,
  random = Math.random,
}: {
  state: OnboardingSpeechState;
  reason: SpeechRotationReason;
  lines: SpeechLines;
  random?: () => number;
}): OnboardingSpeechState {
  const offset = 1 + Math.floor(random() * (lines.length - 1));
  const next = {
    ...state,
    index: (state.index + offset) % lines.length,
    revision: state.revision + 1,
  };

  if (reason === 'timer') return next;

  const anchor = ANCHORS[Math.floor(random() * ANCHORS.length)] ?? 0.5;
  return {
    ...next,
    anchorFraction:
      anchor === state.anchorFraction
        ? ANCHORS[(ANCHORS.indexOf(anchor) + 1) % ANCHORS.length] ?? 0.5
        : anchor,
  };
}
