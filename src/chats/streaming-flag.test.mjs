import test from 'node:test';
import assert from 'node:assert/strict';

import { createStreamingFlag } from './streaming-flag.ts';

test('a superseded run cannot turn the flag off for its successor', async () => {
  const flips = [];
  const flag = createStreamingFlag((streaming) => flips.push(streaming), 20);

  const first = flag.begin();
  const second = flag.begin();
  // The aborted first run finishes while the second is still in flight.
  flag.end(first);

  await new Promise((resolve) => setTimeout(resolve, 40));
  assert.equal(flag.streaming, true);
  assert.deepEqual(flips, [true]);

  flag.end(second);
  assert.equal(flag.streaming, false);
  assert.deepEqual(flips, [true, false]);
});

test('cancelling invalidates the run in flight so its completion is ignored', async () => {
  const flips = [];
  const flag = createStreamingFlag((streaming) => flips.push(streaming), 10);

  const token = flag.begin();
  flag.cancel();
  flag.end(token);

  await new Promise((resolve) => setTimeout(resolve, 25));
  assert.equal(flag.streaming, false);
  assert.deepEqual(flips, []);
});
