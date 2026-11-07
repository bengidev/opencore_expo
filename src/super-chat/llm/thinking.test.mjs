import test from 'node:test';
import assert from 'node:assert/strict';

import { defaultThinkingLevelFor, normalizeThinkingLevels } from './thinking.ts';

test('keeps only known levels in canonical order', () => {
  assert.deepEqual(normalizeThinkingLevels(['max', 'none', 'low', 'turbo']), ['low', 'max']);
  assert.deepEqual(normalizeThinkingLevels(undefined), []);
});

test('defaults to medium, else the middle level', () => {
  assert.equal(defaultThinkingLevelFor([]), null);
  assert.equal(defaultThinkingLevelFor(['low', 'medium', 'high']), 'medium');
  assert.equal(defaultThinkingLevelFor(['low', 'high']), 'low');
});

test('returns an empty list for non-array input', () => {
  assert.deepEqual(normalizeThinkingLevels(null), []);
  assert.deepEqual(normalizeThinkingLevels('low'), []);
});

test('dedupes repeated levels', () => {
  assert.deepEqual(normalizeThinkingLevels(['high', 'low', 'high', 'low']), ['low', 'high']);
});
