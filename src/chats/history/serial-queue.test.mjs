import test from 'node:test';
import assert from 'node:assert/strict';

import { createSerialQueue } from './serial-queue.ts';

test('a read enqueued after a slow write observes the write', async () => {
  const run = createSerialQueue();
  const order = [];
  run(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
    order.push('write');
  });
  const read = run(async () => {
    order.push('read');
    return [...order];
  });
  assert.deepEqual(await read, ['write', 'read']);
});

test('a failed task is reported and does not block the queue', async () => {
  const reported = [];
  const run = createSerialQueue((error) => reported.push(String(error)));
  await assert.rejects(run(async () => { throw new Error('boom'); }));
  assert.equal(await run(async () => 'ok'), 'ok');
  assert.deepEqual(reported, ['Error: boom']);
});
