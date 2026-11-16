// src/chats/history/chat-history.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

import { createChatMessage } from '../chat-message.ts';
import { createInitialChatMessages } from '../chat-state.ts';
import {
  deriveConversationPreview,
  deriveConversationTitle,
  formatConversationTime,
  fromStoredRows,
  groupConversationsByDay,
  persistableMessages,
  toStoredRows,
} from './chat-history.ts';

const now = new Date(2026, 10, 16, 12, 0, 0).getTime(); // Mon 16 Nov 2026, local

test('drops local messages and a trailing blank reply, keeps an errored blank reply', () => {
  const blank = createChatMessage('assistant', '', { streaming: true });
  const errored = createChatMessage('assistant', '', {
    error: { code: 'network', message: 'lost', retryable: true },
  });
  assert.deepEqual(
    persistableMessages([...createInitialChatMessages(), createChatMessage('user', 'hi'), blank]).map((m) => m.role + ':' + m.text),
    ['user:hi'],
  );
  assert.equal(persistableMessages([...createInitialChatMessages(), createChatMessage('user', 'hi'), errored]).length, 2);
});

test('round-trips a settled message through the row shape', () => {
  const messages = [
    createChatMessage('user', 'compare'),
    createChatMessage('assistant', 'answer', {
      reasoning: 'thinking it over',
      reasoningDuration: 4,
      streaming: true,
      reasoningStreaming: true,
      error: { code: 'network', message: 'lost', retryable: true },
    }),
  ];
  const rows = toStoredRows(persistableMessages(messages), 'conv-1');
  assert.equal(rows[1].position, 1);
  assert.equal(rows[1].errorRetryable, 1);
  assert.deepEqual(fromStoredRows(rows), [
    messages[0],
    { ...messages[1], streaming: false, reasoningStreaming: false },
  ]);
});

test('title comes from the first user message, collapsed and capped with an ellipsis', () => {
  assert.equal(deriveConversationTitle([]), 'New chat');
  assert.equal(deriveConversationTitle(createInitialChatMessages()), 'New chat');
  assert.equal(
    deriveConversationTitle([...createInitialChatMessages(), createChatMessage('user', '  why   is\n\nthe sky blue ')]),
    'why is the sky blue',
  );
  assert.equal(deriveConversationTitle([createChatMessage('user', 'a'.repeat(80))]), 'a'.repeat(60) + '…');
  assert.equal(deriveConversationTitle([createChatMessage('user', '😀'.repeat(80))]), '😀'.repeat(60) + '…');
});

test('preview is the last non-empty text, capped at 120', () => {
  assert.equal(deriveConversationPreview(createInitialChatMessages()), '');
  assert.equal(
    deriveConversationPreview([createChatMessage('user', 'hi'), createChatMessage('assistant', 'b'.repeat(200))]),
    'b'.repeat(120) + '…',
  );
});

test('groups by calendar day in local time, newest first', () => {
  const list = [
    { id: 'a', title: 'A', preview: '', createdAt: now, updatedAt: now - 60_000 },
    { id: 'b', title: 'B', preview: '', createdAt: now, updatedAt: new Date(2026, 10, 15, 23, 59).getTime() },
    { id: 'c', title: 'C', preview: '', createdAt: now, updatedAt: new Date(2026, 10, 9, 12, 0).getTime() },
    { id: 'd', title: 'D', preview: '', createdAt: now, updatedAt: new Date(2026, 10, 8, 12, 0).getTime() },
  ];
  assert.deepEqual(
    groupConversationsByDay(list, now).map((group) => [group.label, group.items.map((item) => item.id)]),
    [['Today', ['a']], ['Yesterday', ['b']], ['Previous 7 days', ['c']], ['Earlier', ['d']]],
  );
});

test('formats relative time in the compact ladder', () => {
  assert.equal(formatConversationTime(now - 30_000, now), 'now');
  assert.equal(formatConversationTime(now - 120_000, now), '2m');
  assert.equal(formatConversationTime(now - 3_600_000, now), '1h');
  assert.equal(formatConversationTime(new Date(2026, 10, 13, 12).getTime(), now), 'Fri');
  assert.equal(formatConversationTime(new Date(2026, 9, 27, 12).getTime(), now), '27 Oct');
});
