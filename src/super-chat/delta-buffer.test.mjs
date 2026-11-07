import test from 'node:test';
import assert from 'node:assert/strict';

import { createDeltaBuffer } from './delta-buffer.ts';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('coalesces pushes into one flush per window', async () => {
  const flushes = [];
  const buffer = createDeltaBuffer((value) => flushes.push(value), 20);
  buffer.push('reasoning', 'hm');
  buffer.push('text', 'H');
  buffer.push('text', 'i');
  assert.deepEqual(flushes, []);
  await wait(40);
  assert.deepEqual(flushes, [{ text: 'Hi', reasoning: 'hm' }]);
  buffer.dispose();
});

test('flush sends immediately and dispose cancels', async () => {
  const flushes = [];
  const buffer = createDeltaBuffer((value) => flushes.push(value), 20);
  buffer.push('text', 'now');
  buffer.flush();
  assert.deepEqual(flushes, [{ text: 'now', reasoning: '' }]);
  buffer.push('text', 'gone');
  buffer.dispose();
  await wait(40);
  assert.equal(flushes.length, 1);
});
