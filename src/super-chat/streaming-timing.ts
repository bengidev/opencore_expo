/**
 * Timing and tokenization for the streaming reply. Kept free of React Native
 * imports so the node test suite can verify tokenization directly.
 */

/**
 * Live tokens are only known once they land, so there is no schedule to keep:
 * every word dissolves over this duration from the moment it mounts.
 */
export const STREAM_REVEAL_MS = 160;

export type StreamingToken = {
  readonly text: string;
  /** Word ordinal; -1 for whitespace. */
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
