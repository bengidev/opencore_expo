export type DummyReply = {
  /** The model's working, shown in the reasoning panel. */
  readonly reasoning: string;
  /** The answer, written as Markdown so the response renderer has something to read. */
  readonly answer: string;
};

/**
 * Cycled in order so a demo shows all three streaming rhythms: a one-breath
 * acknowledgement, a list, then a multi-block answer.
 */
export const DUMMY_REPLIES: readonly DummyReply[] = [
  {
    reasoning: 'A short message; the request is clear without many steps.',
    answer: "Got it. Send me the **details**, and I'll help you dig in.",
  },
  {
    reasoning:
      'I need the context: the outcome you want, what is happening now, and what you have already tried. Those three usually narrow down the cause.',
    answer:
      'To give you a precise answer, I need three things:\n\n1. What you expect to happen.\n2. What is happening now.\n3. What you have already tried.\n\nSend all three together.',
  },
  {
    reasoning:
      'I start with the nearest possibility: missing context, then the order of steps, then the relevant code. From there I can write an answer you can try right away.',
    answer:
      '## Direction\n\nStart with the cheapest thing to check. There is usually one point that explains the rest, so we do not have to take everything apart at once.\n\n1. Note the error message.\n2. Compare it with the last working state.\n3. Change one thing, then repeat.\n\n### If code is needed\n\nA snippet this small is enough:\n\n```tsx\nconst next = settle(current, id);\n```\n\n> A small change you can repeat is more useful than one large fix that is hard to read.\n\nAfter that, I can help you plan the lowest-risk fix.',
  },
];

export function pickDummyReply(turn: number): DummyReply {
  const index = ((turn % DUMMY_REPLIES.length) + DUMMY_REPLIES.length) % DUMMY_REPLIES.length;
  return DUMMY_REPLIES[index];
}
