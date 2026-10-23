import test from 'node:test';
import assert from 'node:assert/strict';
import { appendChatExchange, createInitialChatMessages, readChatSeed } from './chat-state.ts';
import { normalizeComposerDraft } from './composer-state.ts';

const greeting = 'Halo. Saya OpenCore. Kirim pesan untuk mulai berbicara.';
const reply = 'Pesan diterima. Penyedia model belum terhubung, jadi balasan ini masih lokal di perangkat.';

test('creates the initial assistant greeting', () => {
  assert.deepEqual(createInitialChatMessages().map(({ role, text }) => ({ role, text })), [{ role: 'assistant', text: greeting }]);
});
test('appends trimmed user text followed by the local assistant reply', () => {
  const result = appendChatExchange([], '  Hai  ');
  assert.deepEqual(result.map(({ role, text }) => ({ role, text })), [{ role: 'user', text: 'Hai' }, { role: 'assistant', text: reply }]);
});
test('blank exchanges preserve the existing array', () => {
  const messages = createInitialChatMessages();
  assert.equal(appendChatExchange(messages, '  '), messages);
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
