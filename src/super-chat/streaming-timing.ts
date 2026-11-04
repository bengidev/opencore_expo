/**
 * Timing and tokenization for the streaming reply. Kept free of React Native
 * imports so the node test suite can verify the schedule directly.
 */

/** Let the bubble's entering animation start before the first word fades in. */
export const STREAM_LEAD_IN_MS = 80;
/** The transitions.dev streaming-text cadence: one word every 60ms. */
export const STREAM_WORD_STAGGER_MS = 60;
/** Each word dissolves over 350ms, so roughly six words are in flight at once. */
export const STREAM_WORD_DURATION_MS = 350;
/**
 * The reasoning trace is a faster read than the answer: it is the model's
 * working, not the thing the reader came for, so its words land closer
 * together while still reading as one stream.
 */
export const REASONING_WORD_STAGGER_MS = 40;
/** Small cushion so the completion swap never clips the last fade. */
export const STREAM_TAIL_BUFFER_MS = 60;

export type StreamingToken = {
  readonly text: string;
  /** Word ordinal used for the stagger; -1 for whitespace. */
  readonly wordIndex: number;
};

export function tokenizeStreamingText(text: string): StreamingToken[] {
  const parts = text.match(/\s+|\S+/g) ?? [];
  let wordIndex = 0;

  return parts.map((part) => {
    if (/\S/.test(part)) {
      const token = { text: part, wordIndex };
      wordIndex += 1;
      return token;
    }

    return { text: part, wordIndex: -1 };
  });
}

export function countStreamingWords(text: string): number {
  return (text.match(/\S+/g) ?? []).length;
}

export function getStreamingDurationMs(text: string): number {
  return getWordScheduleMs(countStreamingWords(text), STREAM_WORD_STAGGER_MS);
}

export function getReasoningDurationMs(text: string): number {
  return getWordScheduleMs(countStreamingWords(text), REASONING_WORD_STAGGER_MS);
}

/** The shared lead-in + stagger + fade + tail schedule, in milliseconds. */
export function getWordScheduleMs(wordCount: number, staggerMs: number): number {
  return (
    STREAM_LEAD_IN_MS + wordCount * staggerMs + STREAM_WORD_DURATION_MS + STREAM_TAIL_BUFFER_MS
  );
}
