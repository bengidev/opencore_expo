import assert from 'node:assert/strict';
import test from 'node:test';
import { advanceSpeech } from './speech-rotation.ts';

const lines = ['Hello', 'Tasks', 'Start'];
const state = { index: 0, revision: 0, anchorFraction: 0.5 };

test('timed speech rotates to another line', () => {
  assert.deepEqual(
    advanceSpeech({ state, reason: 'timer', lines, random: () => 0 }),
    { index: 1, revision: 1, anchorFraction: 0.5 },
  );
});

test('tap speech rotates and repositions its anchor without emitting a timer motion', () => {
  const values = [0, 0];
  assert.deepEqual(
    advanceSpeech({ state, reason: 'tap', lines, random: () => values.shift() ?? 0 }),
    { index: 1, revision: 1, anchorFraction: 0.42 },
  );
});
