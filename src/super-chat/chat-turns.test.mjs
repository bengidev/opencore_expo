import test from 'node:test';
import assert from 'node:assert/strict';

import { createChatMessage } from './chat-message.ts';
import { createInitialChatMessages } from './chat-state.ts';
import { toChatTurns } from './chat-turns.ts';

test('drops local and empty assistant turns but keeps a partial reply', () => {
  const messages = [
    ...createInitialChatMessages(),
    createChatMessage('user', 'hi'),
    createChatMessage('assistant', ''),
    createChatMessage('assistant', '', {
      error: { code: 'network', message: 'lost', retryable: true },
    }),
    createChatMessage('assistant', 'partial', {
      error: { code: 'network', message: 'lost', retryable: true },
    }),
    createChatMessage('user', 'again'),
    createChatMessage('assistant', 'answer'),
  ];
  assert.deepEqual(toChatTurns(messages), [
    { role: 'user', content: 'hi' },
    { role: 'assistant', content: 'partial' },
    { role: 'user', content: 'again' },
    { role: 'assistant', content: 'answer' },
  ]);
});

test('caps history and never starts on an assistant turn', () => {
  const messages = [];
  for (let index = 0; index < 40; index += 1) {
    messages.push(createChatMessage(index % 2 === 0 ? 'user' : 'assistant', `m${index}`));
  }
  const turns = toChatTurns(messages, 20);
  assert.equal(turns.length, 20);
  assert.equal(turns[0].role, 'user');
  assert.equal(turns.at(-1).content, 'm39');
});
