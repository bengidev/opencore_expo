import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendReplyDelta,
  appendUserMessage,
  applyStreamEvent,
  beginAssistantReply,
  createInitialChatMessages,
  failAssistantReply,
  finishAssistantReply,
  readChatSeed,
  settleAssistantReply,
  startAssistantAnswer,
} from './chat-state.ts';
import { createChatMessage } from './chat-message.ts';
import { normalizeComposerDraft } from './composer-state.ts';

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

test('only an empty chunk is a no-op; whitespace is appended', () => {
  const start = [createChatMessage('assistant', 'Hi', { streaming: true })];
  const id = start[0].id;

  assert.equal(appendReplyDelta(start, id, 'text', ''), start);

  const spaced = appendReplyDelta(appendReplyDelta(start, id, 'text', ' '), id, 'text', 'there');
  assert.equal(spaced[0].text, 'Hi there');
  assert.equal(start[0].text, 'Hi');
  assert.equal(appendReplyDelta(start, id, 'reasoning', ' ')[0].reasoningStreaming, true);
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

test('a stream event drives reasoning, answer, and terminal state', () => {
  const start = [createChatMessage('assistant', '', { streaming: true })];
  const id = start[0].id;
  const reasoning = applyStreamEvent(start, id, { type: 'reasoning-delta', text: 'hm' });
  assert.equal(reasoning[0].reasoning, 'hm');
  assert.equal(reasoning[0].reasoningStreaming, true);
  const answer = applyStreamEvent(reasoning, id, { type: 'text-delta', text: 'Hi' }, 2);
  assert.equal(answer[0].text, 'Hi');
  assert.equal(answer[0].reasoningStreaming, false);
  assert.equal(answer[0].reasoningDuration, 2);
  const failed = applyStreamEvent(answer, id, {
    type: 'error', code: 'rate-limit', message: 'slow down', retryable: true,
  });
  assert.equal(failed[0].streaming, false);
  assert.equal(failed[0].error.code, 'rate-limit');
  const done = applyStreamEvent(answer, id, { type: 'done', finishReason: 'stop' });
  assert.equal(done[0].streaming, false);
});

test('done ends a reasoning-only reply instead of leaving the trace streaming', () => {
  const start = [createChatMessage('assistant', '', { streaming: true })];
  const id = start[0].id;
  const reasoning = applyStreamEvent(start, id, { type: 'reasoning-delta', text: 'hm' });
  const done = applyStreamEvent(reasoning, id, { type: 'done', finishReason: 'stop' }, 2);
  assert.equal(done[0].reasoningStreaming, false);
  assert.equal(done[0].reasoningDuration, 2);
  assert.equal(done[0].streaming, false);
  assert.equal(done[0].text, '');
});

test('an error after a reasoning delta settles the trace duration', () => {
  const start = [createChatMessage('assistant', '', { streaming: true })];
  const id = start[0].id;
  const reasoning = applyStreamEvent(start, id, { type: 'reasoning-delta', text: 'hm' });
  assert.equal(reasoning[0].reasoningStreaming, true);

  const failed = applyStreamEvent(
    reasoning,
    id,
    { type: 'error', code: 'network', message: 'dropped', retryable: true },
    3,
  );

  assert.equal(failed[0].reasoningStreaming, false);
  assert.equal(failed[0].reasoningDuration, 3);
  assert.equal(failed[0].streaming, false);
  assert.equal(failed[0].error?.code, 'network');
});
