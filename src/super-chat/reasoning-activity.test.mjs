import test from 'node:test';
import assert from 'node:assert/strict';

import { formatThoughtDuration, reasoningActivity } from './reasoning-activity.ts';
import { createChatMessage } from './chat-message.ts';

test('formats whole seconds, single and plural', () => {
  assert.equal(formatThoughtDuration(1), 'THOUGHT FOR 1 SECOND');
  assert.equal(formatThoughtDuration(4), 'THOUGHT FOR 4 SECONDS');
  assert.equal(formatThoughtDuration(61), 'THOUGHT FOR 61 SECONDS');
});

test('rounds to the nearest second and never reports zero', () => {
  assert.equal(formatThoughtDuration(0), 'THOUGHT FOR 1 SECOND');
  assert.equal(formatThoughtDuration(2.4), 'THOUGHT FOR 2 SECONDS');
  assert.equal(formatThoughtDuration(2.6), 'THOUGHT FOR 3 SECONDS');
});

test('a streaming assistant trace is working', () => {
  const message = createChatMessage('assistant', '', {
    reasoning: 'compare the two paths',
    reasoningStreaming: true,
  });
  assert.deepEqual(reasoningActivity(message), {
    id: `${message.id}-reasoning`,
    text: 'compare the two paths',
    status: 'working',
    duration: 1,
    activeLabel: 'THINKING…',
    summary: 'THOUGHT FOR 1 SECOND',
  });
});

test('a settled trace is complete with its recorded duration', () => {
  const message = createChatMessage('assistant', 'answer', {
    reasoning: 'done',
    reasoningDuration: 4,
  });
  assert.equal(reasoningActivity(message)?.status, 'complete');
  assert.equal(reasoningActivity(message)?.summary, 'THOUGHT FOR 4 SECONDS');
});

test('nothing to log: user messages and empty traces without a duration', () => {
  assert.equal(reasoningActivity(createChatMessage('user', 'hi')), null);
  assert.equal(reasoningActivity(createChatMessage('assistant', 'hi')), null);
});

test('blank reasoning with a duration still folds to its summary', () => {
  const message = createChatMessage('assistant', 'answer', { reasoningDuration: 1 });
  assert.equal(reasoningActivity(message)?.summary, 'THOUGHT FOR 1 SECOND');
  assert.equal(reasoningActivity(message)?.text, '');
});
