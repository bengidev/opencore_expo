import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendReplyDelta,
  appendUserMessage,
  beginAssistantReply,
  createInitialChatMessages,
  failAssistantReply,
  finishAssistantReply,
  readChatSeed,
  settleAssistantReply,
  startAssistantAnswer,
} from './chat-state.ts';
import { createChatMessage } from './chat-message.ts';
import { countMarkdownWords, parseMarkdown } from './chat-markdown.ts';
import { normalizeComposerDraft } from './composer-state.ts';
import { DUMMY_REPLIES, pickDummyReply } from './dummy-replies.ts';
import {
  getReasoningDurationMs,
  getStreamingDurationMs,
  REASONING_WORD_STAGGER_MS,
  STREAM_LEAD_IN_MS,
  STREAM_TAIL_BUFFER_MS,
  STREAM_WORD_DURATION_MS,
  STREAM_WORD_STAGGER_MS,
  tokenizeStreamingText,
} from './streaming-timing.ts';

const greeting = "Hi. I'm OpenCore. Send a message to start talking.";

function idIndex(messages) {
  return messages.findIndex((message) => message.role === 'assistant');
}

test('creates the initial assistant greeting', () => {
  const messages = createInitialChatMessages();
  assert.deepEqual(
    messages.map(({ role, text }) => ({ role, text })),
    [{ role: 'assistant', text: greeting }],
  );
  assert.equal(messages[0].localOnly, true);
});

test('appends trimmed user text without creating a reply', () => {
  const result = appendUserMessage([], '  Hai  ');
  assert.deepEqual(
    result.map(({ role, text, streaming }) => ({ role, text, streaming })),
    [{ role: 'user', text: 'Hai', streaming: false }],
  );
});

test('blank user messages preserve the existing array', () => {
  const messages = createInitialChatMessages();
  assert.equal(appendUserMessage(messages, '  '), messages);
});

test('finishes only the matching streaming reply', () => {
  const messages = appendUserMessage(createInitialChatMessages(), 'Hai');
  const reply = {
    id: 'reply-1',
    role: 'assistant',
    text: 'Siap.',
    streaming: true,
    reasoning: 'Cukup singkat.',
    reasoningStreaming: false,
  };
  const withReply = [...messages, reply];

  const settled = finishAssistantReply(withReply, reply.id);
  assert.equal(settled.at(-1).streaming, false);
  assert.equal(finishAssistantReply(settled, reply.id), settled);
});

test('finishing an unknown reply preserves the existing array', () => {
  const messages = createInitialChatMessages();
  assert.equal(finishAssistantReply(messages, 'missing'), messages);
});

test('starts the answer and records the measured reasoning duration', () => {
  const reply = {
    id: 'reply-1',
    role: 'assistant',
    text: 'Jawaban lengkap.',
    streaming: false,
    reasoning: 'Pertimbangan.',
    reasoningStreaming: true,
  };

  const started = startAssistantAnswer([reply], reply.id, 3);
  assert.equal(started[0].streaming, true);
  assert.equal(started[0].reasoningStreaming, false);
  assert.equal(started[0].reasoningDuration, 3);
  assert.equal(startAssistantAnswer([reply], 'missing', 3)[0], reply);
});

test('settling an interrupted reply does not overwrite a measured duration', () => {
  const reply = {
    id: 'reply-1',
    role: 'assistant',
    text: 'Jawaban lengkap.',
    streaming: true,
    reasoning: 'Pertimbangan.',
    reasoningStreaming: false,
    reasoningDuration: 3,
  };

  const settled = settleAssistantReply([reply], reply.id, 9);
  assert.equal(settled[0].streaming, false);
  assert.equal(settled[0].reasoningStreaming, false);
  assert.equal(settled[0].reasoningDuration, 3);

  const interrupted = settleAssistantReply(
    [{ ...reply, reasoningDuration: undefined }],
    reply.id,
    2,
  );
  assert.equal(interrupted[0].reasoningDuration, 2);
});

test('reads and trims the first seed, rejecting missing or blank values', () => {
  assert.equal(readChatSeed(undefined), null);
  assert.equal(readChatSeed('  '), null);
  assert.equal(readChatSeed('  hello  '), 'hello');
  assert.equal(readChatSeed([' first ', 'second']), 'first');
  assert.equal(readChatSeed([' ', 'ignored']), null);
});

test('normalizes composer drafts or returns null when blank', () => {
  assert.equal(normalizeComposerDraft('  hello  '), 'hello');
  assert.equal(normalizeComposerDraft(' \n '), null);
});

test('cycles dummy replies from short to long', () => {
  assert.equal(DUMMY_REPLIES.length, 3);
  assert.equal(pickDummyReply(0), DUMMY_REPLIES[0]);
  assert.equal(pickDummyReply(2), DUMMY_REPLIES[2]);
  assert.equal(pickDummyReply(3), DUMMY_REPLIES[0]);

  const wordCounts = DUMMY_REPLIES.map(({ answer }) =>
    countMarkdownWords(parseMarkdown(answer, { streaming: true })),
  );
  assert.ok(wordCounts[0] < wordCounts[1]);
  assert.ok(wordCounts[1] < wordCounts[2]);
  assert.ok(DUMMY_REPLIES.every(({ reasoning }) => reasoning.trim().length > 0));
});

test('tokenizes words and preserves whitespace for layout', () => {
  const tokens = tokenizeStreamingText('Hai  dunia\nbaru');
  assert.deepEqual(
    tokens.map(({ text }) => text),
    ['Hai', '  ', 'dunia', '\n', 'baru'],
  );
  assert.deepEqual(
    tokens.filter(({ wordIndex }) => wordIndex >= 0).map(({ wordIndex }) => wordIndex),
    [0, 1, 2],
  );
});

test('stream duration covers lead-in, stagger, fade, and tail buffer', () => {
  assert.equal(
    getStreamingDurationMs('satu dua tiga'),
    STREAM_LEAD_IN_MS + 3 * STREAM_WORD_STAGGER_MS + STREAM_WORD_DURATION_MS + STREAM_TAIL_BUFFER_MS,
  );
});

test('reasoning duration uses its faster stagger', () => {
  assert.equal(
    getReasoningDurationMs('satu dua tiga'),
    STREAM_LEAD_IN_MS +
      3 * REASONING_WORD_STAGGER_MS +
      STREAM_WORD_DURATION_MS +
      STREAM_TAIL_BUFFER_MS,
  );
});

test('deltas append without replacing unaffected messages', () => {
  const start = [
    createChatMessage('user', 'hi'),
    createChatMessage('assistant', '', { streaming: true }),
  ];
  const id = start[1].id;
  const withText = appendReplyDelta(start, id, 'text', 'Hel');
  assert.notEqual(withText, start);
  assert.equal(start[1].text, '');
  const withMore = appendReplyDelta(withText, id, 'text', 'lo');
  assert.equal(withMore[idIndex(withMore)].text, 'Hello');
  assert.equal(withMore[0], start[0]);
  assert.equal(appendReplyDelta(withMore, id, 'text', ''), withMore);
  assert.equal(
    appendReplyDelta(withMore, id, 'reasoning', 'hmm')[idIndex(withMore)].reasoningStreaming,
    true,
  );
});

test('whitespace-only deltas are dropped on purpose', () => {
  const start = [createChatMessage('assistant', 'Hello', { streaming: true })];
  const id = start[0].id;
  assert.equal(appendReplyDelta(start, id, 'text', '   '), start);
  assert.equal(appendReplyDelta(start, id, 'text', '\n'), start);
  assert.equal(appendReplyDelta(start, id, 'reasoning', ' '), start);
  assert.equal(start[0].text, 'Hello');
  assert.equal(start[0].reasoning, '');
});

test('beginning a reply starts streaming and keeps identity when nothing changes', () => {
  const start = [createChatMessage('assistant', '')];
  const id = start[0].id;

  const begun = beginAssistantReply(start, id);
  assert.notEqual(begun, start);
  assert.equal(begun[0].streaming, true);
  assert.equal(beginAssistantReply(begun, id), begun);
  assert.equal(beginAssistantReply(start, 'missing'), start);
});

test('a failed reply stops streaming and carries a code', () => {
  const start = [
    createChatMessage('assistant', 'par', {
      streaming: true,
      reasoning: 'because',
      reasoningStreaming: true,
    }),
  ];
  const failed = failAssistantReply(start, start[0].id, {
    code: 'rate-limit',
    message: 'slow down',
    retryable: true,
  });
  assert.equal(failed[0].streaming, false);
  assert.equal(failed[0].reasoningStreaming, false);
  assert.equal(failed[0].text, 'par');
  assert.equal(failed[0].reasoning, 'because');
  assert.deepEqual(failed[0].error, {
    code: 'rate-limit',
    message: 'slow down',
    retryable: true,
  });
});
